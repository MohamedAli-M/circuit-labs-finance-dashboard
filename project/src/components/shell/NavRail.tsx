"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  LogOut,
  ReceiptText,
  Settings,
  Sparkles,
  Triangle,
  type LucideIcon,
} from "lucide-react";
import { allowedTabs } from "@/lib/rbac";
import type { AuthUser } from "@/lib/auth";
import type { Tab } from "@/lib/types";

const TAB_META: Record<Tab, { label: string; icon: LucideIcon }> = {
  transactions: { label: "Transactions", icon: ReceiptText },
  stats: { label: "Stats", icon: BarChart3 },
  custom: { label: "Assistant", icon: Sparkles },
};

export function NavRail({
  user,
  onLogout,
}: {
  user: AuthUser;
  onLogout: () => void;
}) {
  const pathname = usePathname();
  const tabs = allowedTabs(user.role);
  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <nav className="sticky top-0 flex h-screen w-20 shrink-0 flex-col items-center gap-1 border-r border-line bg-rail py-5">
      {/* brand */}
      <Link href="/dashboard" className="mb-3 text-brand" aria-label="Circuit Labs">
        <Triangle className="h-7 w-7 fill-brand" />
      </Link>
      <div className="mb-3 w-8 border-t border-line" />

      {/* tabs */}
      <div className="flex flex-1 flex-col gap-1">
        {tabs.map((tab) => {
          const meta = TAB_META[tab];
          const href = `/dashboard/${tab}`;
          const active = pathname === href;
          const Icon = meta.icon;
          return (
            <Link
              key={tab}
              href={href}
              className={`flex w-16 flex-col items-center gap-1 rounded-xl py-2.5 text-center text-[10px] font-medium leading-tight transition-colors ${
                active
                  ? "bg-brand/10 text-brand"
                  : "text-muted hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{meta.label}</span>
            </Link>
          );
        })}
      </div>

      {/* bottom controls */}
      <div className="mt-2 flex flex-col items-center gap-3">
        <button
          type="button"
          className="text-muted transition-colors hover:text-white"
          title="Settings"
        >
          <Settings className="h-5 w-5" />
        </button>
        <div
          className="grid h-9 w-9 place-items-center rounded-full bg-surface text-xs font-semibold text-white/80"
          title={user.name}
        >
          {initials}
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="text-muted transition-colors hover:text-cashout"
          title="Log out"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </nav>
  );
}
