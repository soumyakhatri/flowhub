import type { User } from "../types";
import {
  ApiError,
  api,
  asRecord,
  clearSession,
  getRefreshToken,
  mergeData,
  normalizeUser,
  pickToken,
  refreshSession,
  setAccessToken,
  setRefreshToken,
} from "./client";

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

async function applySession(body: unknown): Promise<User> {
  const record = mergeData(body);
  const access = pickToken(record, "accessToken");
  const refresh = pickToken(record, "refreshToken");
  if (access) setAccessToken(access);
  if (refresh) setRefreshToken(refresh);

  const nested = asRecord(record.user);
  if (nested) return normalizeUser(nested);
  if (typeof record.email === "string" && typeof record.name === "string") {
    return normalizeUser(record);
  }
  return getMe();
}

export function refresh() {
  return refreshSession();
}

export async function register(input: RegisterInput): Promise<User> {
  const body = await api<unknown>("/auth/register", {
    method: "POST",
    body: input,
    skipAuth: true,
  });
  return applySession(body);
}

export async function login(input: LoginInput): Promise<User> {
  const body = await api<unknown>("/auth/login", {
    method: "POST",
    body: input,
    skipAuth: true,
  });
  return applySession(body);
}

export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken();
  try {
    await api("/auth/logout", {
      method: "POST",
      body: refreshToken ? { refreshToken } : {},
      retry: false,
    });
  } catch {
    /* Local session is cleared even if the API is unreachable. */
  } finally {
    clearSession();
  }
}

export async function getMe(): Promise<User> {
  const body = await api<unknown>("/users/me");
  const record = mergeData(body);
  const user = asRecord(record.user) ?? record;
  const normalized = normalizeUser(user);
  if (!normalized.id && !normalized.email) {
    throw new ApiError("Profile response was empty", 500, "BAD_RESPONSE");
  }
  return normalized;
}