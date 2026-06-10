import type { PublicUser } from "./types";

/**
 * Client-side auth state, persisted in localStorage.
 *
 * Per the brief we store exactly the user's id, name, role and allowedTabs -
 * never the password (it never leaves the server; see the login route).
 */
export type AuthUser = Pick<PublicUser, "id" | "name" | "role" | "allowedTabs">;

const KEY = "circuitlabs.auth";

export function storeUser(user: AuthUser): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(user));
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function clearUser(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}
