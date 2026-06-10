import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser, type AuthUser } from "./auth";
import { canAccess } from "./rbac";
import type { Tab } from "./types";

/**
 * Require a logged-in user. Returns `undefined` while the localStorage check is
 * still running (render nothing then, to avoid a flash), and redirects to
 * /login if nobody is signed in.
 */
export function useRequireAuth(): AuthUser | undefined {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | undefined>(undefined);
  useEffect(() => {
    const u = getStoredUser();
    if (!u) {
      router.replace("/login");
      return;
    }
    setUser(u);
  }, [router]);
  return user;
}

/**
 * Require access to a specific tab. Redirects to /login if signed out, or to
 * /dashboard (which forwards to their first allowed tab) if signed in but not
 * permitted - this is the RBAC route guard.
 */
export function useRequireTab(tab: Tab): AuthUser | undefined {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | undefined>(undefined);
  useEffect(() => {
    const u = getStoredUser();
    if (!u) {
      router.replace("/login");
      return;
    }
    if (!canAccess(u.role, tab)) {
      router.replace("/dashboard");
      return;
    }
    setUser(u);
  }, [router, tab]);
  return user;
}
