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
const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1").replace(/\/$/, "");
const ACCESS_KEY = "flowhub.accessToken";
const REFRESH_KEY = "flowhub.refreshToken";
let memoryAccessToken = readStorage(ACCESS_KEY);
function readStorage(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function writeStorage(key, value) {
  try {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  } catch {
  }
}
function getAccessToken() {
  return memoryAccessToken;
}
function setAccessToken(token) {
  memoryAccessToken = token;
  writeStorage(ACCESS_KEY, token);
}
function getRefreshToken() {
  return readStorage(REFRESH_KEY);
}
function setRefreshToken(token) {
  writeStorage(REFRESH_KEY, token);
}
function clearSession() {
  setAccessToken(null);
  setRefreshToken(null);
}
class ApiError extends Error {
  status;
  code;
  requestId;
  constructor(message, status, code, requestId) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.requestId = requestId;
  }
}
function errorMessage(error) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return "Something went wrong";
}
let refreshInFlight = null;
async function refreshSession() {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = performRefresh().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}
async function performRefresh() {
  const refreshToken = getRefreshToken();
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: refreshToken ? { "Content-Type": "application/json" } : void 0,
      body: refreshToken ? JSON.stringify({ refreshToken }) : void 0
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
async function api(path, options = {}) {
  const response = await request(path, options);
  const body = response.status === 204 ? null : await readJson(response);
  if (response.status === 401 && options.retry !== false && !options.skipAuth && !path.startsWith("/auth/")) {
    const refreshed = await refreshSession();
    if (refreshed) return api(path, { ...options, retry: false });
  }
  if (!response.ok) throw toApiError(response, body);
  if (response.status === 204) return void 0;
  return body;
}
async function request(path, options) {
  const headers = new Headers();
  if (options.body !== void 0) headers.set("Content-Type", "application/json");
  if (!options.skipAuth) {
    const token = getAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }
  try {
    return await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? (options.body !== void 0 ? "POST" : "GET"),
      credentials: "include",
      headers,
      body: options.body !== void 0 ? JSON.stringify(options.body) : void 0
    });
  } catch {
    throw new ApiError(
      `Cannot reach the API at ${API_BASE_URL}. Start the API and check VITE_API_URL.`,
      0,
      "NETWORK"
    );
  }
}
async function readJson(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
function toApiError(response, body) {
  const record = asRecord(body);
  const error = asRecord(record?.error) ?? record;
  const message = readString(error, "message") || response.statusText || "Request failed";
  return new ApiError(
    message,
    response.status,
    readString(error, "code"),
    readString(error, "requestId")
  );
}
function asRecord(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value;
}
function mergeData(body) {
  const record = asRecord(body) ?? {};
  const data = asRecord(record.data);
  return data ? { ...record, ...data } : record;
}
function readString(record, key) {
  if (!record) return void 0;
  const value = record[key];
  return typeof value === "string" && value.trim() ? value : void 0;
}
function readId(record) {
  const id = record.id ?? record._id;
  if (typeof id === "string") return id;
  if (id && typeof id === "object" && "toString" in id) {
    const text = String(id);
    if (text && text !== "[object Object]") return text;
  }
  return "";
}
function readRef(value) {
  if (typeof value === "string" && value) return value;
  const record = asRecord(value);
  if (!record) return void 0;
  const id = readId(record);
  return id || void 0;
}
function pickToken(record, key) {
  const direct = readString(record, key);
  if (direct) return direct;
  const tokens = asRecord(record.tokens);
  return readString(tokens, key) ?? null;
}
function readList(body) {
  if (Array.isArray(body)) return body;
  const record = asRecord(body);
  if (!record) return [];
  if (Array.isArray(record.data)) return record.data;
  const nested = asRecord(record.data);
  const sources = [record, nested];
  for (const source of sources) {
    if (!source) continue;
    for (const key of ["items", "results", "docs", "organizations", "workspaces", "projects", "tasks", "comments"]) {
      if (Array.isArray(source[key])) return source[key];
    }
  }
  return [];
}
function readOptionalString(record, key) {
  const value = record[key];
  if (typeof value !== "string") return void 0;
  const trimmed = value.trim();
  return trimmed || void 0;
}
function normalizeUser(raw) {
  const record = asRecord(raw);
  if (!record) throw new ApiError("User payload was empty", 500, "BAD_RESPONSE");
  return {
    id: readId(record),
    email: readString(record, "email") ?? "",
    name: readString(record, "name") ?? "User",
    avatarUrl: readString(record, "avatarUrl") ?? null,
    status: readString(record, "status"),
    createdAt: readString(record, "createdAt"),
    updatedAt: readString(record, "updatedAt")
  };
}
function normalizeOrganization(raw) {
  const record = asRecord(raw);
  if (!record) return null;
  const id = readId(record);
  if (!id) return null;
  const membership = asRecord(record.membership);
  const role = readString(record, "role") ?? readString(membership, "role");
  return {
    id,
    name: readString(record, "name") ?? "Untitled organization",
    role: role === "OWNER" || role === "ADMIN" || role === "MEMBER" ? role : void 0,
    createdBy: readRef(record.createdBy),
    createdAt: readString(record, "createdAt"),
    updatedAt: readString(record, "updatedAt")
  };
}
function normalizeWorkspace(raw) {
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
    updatedAt: readString(record, "updatedAt")
  };
}
function normalizeProject(raw) {
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
    updatedAt: readString(record, "updatedAt")
  };
}
function normalizeTask(raw) {
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
    updatedAt: readString(record, "updatedAt")
  };
}
function normalizeComment(raw) {
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
    updatedAt: readString(record, "updatedAt")
  };
}
function mapList(body, normalize) {
  return readList(body).map(normalize).filter((item) => item !== null);
}
export {
  API_BASE_URL,
  ApiError,
  api,
  asRecord,
  clearSession,
  errorMessage,
  getAccessToken,
  getRefreshToken,
  mapList,
  mergeData,
  normalizeComment,
  normalizeOrganization,
  normalizeProject,
  normalizeTask,
  normalizeUser,
  normalizeWorkspace,
  pickToken,
  readId,
  readList,
  readString,
  refreshSession,
  setAccessToken,
  setRefreshToken
};
