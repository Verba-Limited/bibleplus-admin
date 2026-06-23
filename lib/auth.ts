"use client";

export interface AdminUser {
  id: string;
  username: string;
  role: string;
}

export interface AuthSession {
  accessToken: string;
  user: AdminUser;
}

export const AUTH_TOKEN_KEY = "authToken";
export const AUTH_USER_KEY = "authUser";
export const AUTH_COOKIE_KEY = "adminAccessToken";

const ADMIN_ROLES = new Set(["admin", "superadmin"]);

function getTokenExpiry(accessToken: string) {
  try {
    const [, payload] = accessToken.split(".");
    if (!payload) return null;

    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decodedPayload = JSON.parse(window.atob(normalizedPayload));

    return typeof decodedPayload.exp === "number"
      ? decodedPayload.exp * 1000
      : null;
  } catch {
    return null;
  }
}

function setAuthCookie(accessToken: string) {
  const expiresAt = getTokenExpiry(accessToken);
  const maxAge = expiresAt
    ? Math.max(0, Math.floor((expiresAt - Date.now()) / 1000))
    : 60 * 60 * 24;

  document.cookie = `${AUTH_COOKIE_KEY}=${accessToken}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

function clearAuthCookie() {
  document.cookie = `${AUTH_COOKIE_KEY}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function storeAuthSession(session: AuthSession) {
  localStorage.setItem(AUTH_TOKEN_KEY, session.accessToken);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(session.user));
  localStorage.setItem("userRole", session.user.role);
  localStorage.setItem("isLoggedIn", "true");
  setAuthCookie(session.accessToken);
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  localStorage.removeItem("userRole");
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("username");
  localStorage.removeItem("userEmail");
  clearAuthCookie();
}

export function getAuthSession(): AuthSession | null {
  const accessToken = localStorage.getItem(AUTH_TOKEN_KEY);
  const storedUser = localStorage.getItem(AUTH_USER_KEY);

  if (!accessToken || !storedUser) return null;

  try {
    const user = JSON.parse(storedUser) as AdminUser;
    return { accessToken, user };
  } catch {
    clearAuthSession();
    return null;
  }
}

export function hasValidAuthSession() {
  const session = getAuthSession();
  if (!session) return false;

  const expiresAt = getTokenExpiry(session.accessToken);
  if (expiresAt && expiresAt <= Date.now()) {
    clearAuthSession();
    return false;
  }

  if (!ADMIN_ROLES.has(session.user.role.toLowerCase())) {
    clearAuthSession();
    return false;
  }

  return true;
}
