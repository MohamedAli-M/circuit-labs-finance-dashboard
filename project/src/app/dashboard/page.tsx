"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser } from "@/lib/auth";
import { allowedTabs } from "@/lib/rbac";

// /dashboard forwards to the first tab the user is allowed to see.
export default function DashboardIndex() {
  const router = useRouter();
  useEffect(() => {
    const u = getStoredUser();
    if (!u) {
      router.replace("/login");
      return;
    }
    const tabs = allowedTabs(u.role);
    router.replace(`/dashboard/${tabs[0] ?? "transactions"}`);
  }, [router]);
  return null;
}
