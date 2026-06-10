"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser } from "@/lib/auth";

// Entry point: bounce to the dashboard if signed in, otherwise to login.
export default function Home() {
  const router = useRouter();
  useEffect(() => {
    router.replace(getStoredUser() ? "/dashboard" : "/login");
  }, [router]);
  return null;
}
