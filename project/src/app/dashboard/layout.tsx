"use client";

import { useRouter } from "next/navigation";
import { clearUser } from "@/lib/auth";
import { useRequireAuth } from "@/lib/useAuth";
import { NavRail } from "@/components/shell/NavRail";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const user = useRequireAuth();

  // While the localStorage check runs (or we're redirecting), render an empty
  // dark canvas - no flash of protected content.
  if (!user) return <div className="min-h-screen bg-bg" />;

  return (
    <div className="flex min-h-screen bg-bg">
      <NavRail
        user={user}
        onLogout={() => {
          clearUser();
          router.replace("/login");
        }}
      />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
