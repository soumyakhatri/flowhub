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
  setRefreshToken
} from "./client";
async function applySession(body) {
  const record = mergeData(body);
  const access = pickToken(record, "accessToken");
  const refresh2 = pickToken(record, "refreshToken");
  if (access) setAccessToken(access);
  if (refresh2) setRefreshToken(refresh2);
  const nested = asRecord(record.user);
  if (nested) return normalizeUser(nested);
  if (typeof record.email === "string" && typeof record.name === "string") {
    return normalizeUser(record);
  }
  return getMe();
}
function refresh() {
  return refreshSession();
}
async function register(input) {
  const body = await api("/auth/register", {
    method: "POST",
    body: input,
    skipAuth: true
  });
  return applySession(body);
}
async function login(input) {
  const body = await api("/auth/login", {
    method: "POST",
    body: input,
    skipAuth: true
  });
  return applySession(body);
}
async function logout() {
  const refreshToken = getRefreshToken();
  try {
    await api("/auth/logout", {
      method: "POST",
      body: refreshToken ? { refreshToken } : {},
      retry: false
    });
  } catch {
  } finally {
    clearSession();
  }
}
async function getMe() {
  const body = await api("/users/me");
  const record = mergeData(body);
  const user = asRecord(record.user) ?? record;
  const normalized = normalizeUser(user);
  if (!normalized.id && !normalized.email) {
    throw new ApiError("Profile response was empty", 500, "BAD_RESPONSE");
  }
  return normalized;
}
export {
  getMe,
  login,
  logout,
  refresh,
  register
};
