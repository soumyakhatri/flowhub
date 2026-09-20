/**
 * HTTP client for the FlowHub Phase 1 API.
 *
 * Session storage
 * ---------------
 * The access token is the source of truth in memory for the current page.
 * It is also mirrored to localStorage so a reload can try an authenticated
 * request immediately. On startup, AuthProvider calls POST /auth/refresh
 * (cookie and/or stored refresh token) and replaces the access token.
 *
 * The API prefers an httpOnly refresh cookie. If the login response also
 * returns a refreshToken in the body, we keep it in localStorage and send
 * it on refresh as a fallback when the cookie is not present.
 *
 * Do not put the access token in a long-lived cookie from this app. A later
 * phase can drop the localStorage mirror once refresh is proven in production.
 */

import type { Comment, Organization, Project, Task, User, Workspace } from "../types";

export const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1"
).replace(/\/$/, "");

const ACCESS_KEY = "flowhub.accessToken";
const REFRESH_KEY = "flowhub.refreshToken";

let memoryAccessToken: string | null = readStorage(ACCESS_KEY);

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string | null) {
  try {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  } catch {
    /* private mode or blocked storage */
  }
}

export function getAccessToken(): string | null {
  return memoryAccessToken;
}

export function setAccessToken(token: string | null) {
  memoryAccessToken = token;
  writeStorage(ACCESS_KEY, token);
}

export function getRefreshToken(): string | null {
  return readStorage(REFRESH_KEY);
}

export function setRefreshToken(token: string | null) {
  writeStorage(REFRESH_KEY, token);
}

export function clearSession() {
  setAccessToken(null);
  setRefreshToken(null);
}

export class ApiError extends Error {
  status: number;
  code?: string;
  requestId?: string;

  constructor(message: string, status: number, code?: string, requestId?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.requestId = requestId;
  }
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return "Something went wrong";
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  skipAuth?: boolean;
  retry?: boolean;
};

let refreshInFlight: Promise<string | null> | null = null;

export async function refreshSession(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = performRefresh().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

async function performRefresh(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: refreshToken
        ? { "Content-Type": "application/json" }
        : undefined,
      body: refreshToken ? JSON.stringify({ refreshToken }) : undefined,
    });
  } catch {
    return null;
  }

  if (!response.ok) return null;

  const body = await readJson(response);
  const record = mergeData(body);
  const access = pickToken(record, "accessToken");
  const refresh = pickToken(record, "refreshToken");
  if (access) setAccessToken(access);
  if (refresh) setRefreshToken(refresh);
  return access;
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await request(path, options);
  const body = response.status === 204 ? null : await readJson(response);

  if (
    response.status === 401 &&
    options.retry !== false &&
    !options.skipAuth &&
    !path.startsWith("/auth/")
  ) {
    const refreshed = await refreshSession();
    if (refreshed) return api<T>(path, { ...options, retry: false });
  }

  if (!response.ok) throw toApiError(response, body);
  if (response.status === 204) return undefined as T;
  return body as T;
}

async function request(path: string, options: RequestOptions): Promise<Response> {
  const headers = new Headers();
  if (options.body !== undefined) headers.set("Content-Type", "application/json");
  if (!options.skipAuth) {
    const token = getAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  try {
    return await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? (options.body !== undefined ? "POST" : "GET"),
      credentials: "include",
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError(
      `Cannot reach the API at ${API_BASE_URL}. Start the API and check VITE_API_URL.`,
      0,
      "NETWORK",
    );
  }
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function toApiError(response: Response, body: unknown): ApiError {
  const record = asRecord(body);
  const error = asRecord(record?.error) ?? record;
  const message =
    readString(error, "message") ||
    response.statusText ||
    "Request failed";
  return new ApiError(
    message,
    response.status,
    readString(error, "code"),
    readString(error, "requestId"),
  );
}

export function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export function mergeData(body: unknown): Record<string, unknown> {
  const record = asRecord(body) ?? {};
  const data = asRecord(record.data);
  return data ? { ...record, ...data } : record;
}

export function readString(record: Record<string, unknown> | null, key: string): string | undefined {
  if (!record) return undefined;
  const value = record[key];
  return typeof value === "string" && value.trim() ? value : undefined;
}

export function readId(record: Record<string, unknown>): string {
  const id = record.id ?? record._id;
  if (typeof id === "string") return id;
  if (id && typeof id === "object" && "toString" in id) {
    const text = String(id);
    if (text && text !== "[object Object]") return text;
  }
  return "";
}

function readRef(value: unknown): string | undefined {
  if (typeof value === "string" && value) return value;
  const record = asRecord(value);
  if (!record) return undefined;
  const id = readId(record);
  return id || undefined;
}

export function pickToken(record: Record<string, unknown>, key: "accessToken" | "refreshToken"): string | null {
  const direct = readString(record, key);
  if (direct) return direct;
  const tokens = asRecord(record.tokens);
  return readString(tokens, key) ?? null;
}

export function readList(body: unknown): unknown[] {
  if (Array.isArray(body)) return body;
  const record = asRecord(body);
  if (!record) return [];
  if (Array.isArray(record.data)) return record.data;
  const nested = asRecord(record.data);
  const sources = [record, nested];
  for (const source of sources) {
    if (!source) continue;
    for (const key of ["items", "results", "docs", "organizations", "workspaces", "projects", "tasks", "comments"]) {
      if (Array.isArray(source[key])) return source[key] as unknown[];
    }
  }
  return [];
}

function readOptionalString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

export function normalizeUser(raw: unknown): User {
  const record = asRecord(raw);
  if (!record) throw new ApiError("User payload was empty", 500, "BAD_RESPONSE");
  return {
    id: readId(record),
    email: readString(record, "email") ?? "",
    name: readString(record, "name") ?? "User",
    avatarUrl: readString(record, "avatarUrl") ?? null,
    status: readString(record, "status"),
    createdAt: readString(record, "createdAt"),
    updatedAt: readString(record, "updatedAt"),
  };
}

export function normalizeOrganization(raw: unknown): Organization | null {
  const record = asRecord(raw);
  if (!record) return null;
  const id = readId(record);
  if (!id) return null;
  const membership = asRecord(record.membership);
  const role = readString(record, "role") ?? readString(membership, "role");
  return {
    id,
    name: readString(record, "name") ?? "Untitled organization",
    role: role === "OWNER" || role === "ADMIN" || role === "MEMBER" ? role : undefined,
    createdBy: readRef(record.createdBy),
    createdAt: readString(record, "createdAt"),
    updatedAt: readString(record, "updatedAt"),
  };
}

export function normalizeWorkspace(raw: unknown): Workspace | null {
  const record = asRecord(raw);
  if (!record) return null;
  const id = readId(record);
  if (!id) return null;
  return {
    id,
    organizationId: readRef(record.organizationId) ?? readRef(record.organization) ?? "",
    name: readString(record, "name") ?? "Untitled workspace",
    description: readOptionalString(record, "description"),
    createdAt: readString(record, "createdAt"),
    updatedAt: readString(record, "updatedAt"),
  };
}

export function normalizeProject(raw: unknown): Project | null {
  const record = asRecord(raw);
  if (!record) return null;
  const id = readId(record);
  if (!id) return null;
  return {
    id,
    workspaceId: readRef(record.workspaceId) ?? readRef(record.workspace) ?? "",
    name: readString(record, "name") ?? "Untitled project",
    description: readOptionalString(record, "description"),
    createdAt: readString(record, "createdAt"),
    updatedAt: readString(record, "updatedAt"),
  };
}

export function normalizeTask(raw: unknown): Task | null {
  const record = asRecord(raw);
  if (!record) return null;
  const id = readId(record);
  if (!id) return null;
  const due = record.dueDate;
  return {
    id,
    projectId: readRef(record.projectId) ?? readRef(record.project) ?? "",
    workspaceId: readRef(record.workspaceId) ?? readRef(record.workspace),
    title: readString(record, "title") ?? "Untitled task",
    description: readOptionalString(record, "description"),
    status: readString(record, "status") ?? "todo",
    priority: readString(record, "priority") ?? "medium",
    assigneeId: record.assigneeId == null ? null : readRef(record.assigneeId) ?? null,
    dueDate: typeof due === "string" ? due : null,
    createdAt: readString(record, "createdAt"),
    updatedAt: readString(record, "updatedAt"),
  };
}

export function normalizeComment(raw: unknown): Comment | null {
  const record = asRecord(raw);
  if (!record) return null;
  const id = readId(record);
  if (!id) return null;
  const author = asRecord(record.author) ?? asRecord(record.user);
  return {
    id,
    taskId: readRef(record.taskId) ?? readRef(record.task) ?? "",
    authorId: readRef(record.authorId) ?? (author ? readId(author) : "") ?? "",
    authorName: readString(author, "name") ?? readString(record, "authorName"),
    content: typeof record.content === "string" ? record.content : "",
    createdAt: readString(record, "createdAt"),
    updatedAt: readString(record, "updatedAt"),
  };
}

export function mapList<T>(body: unknown, normalize: (raw: unknown) => T | null): T[] {
  return readList(body).map(normalize).filter((item): item is T => item !== null);
}