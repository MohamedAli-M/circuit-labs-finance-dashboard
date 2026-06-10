"use client";

import type { PublicUser } from "@/lib/types";

const initialsOf = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

/**
 * "Authorized By" cell. Shows the user's initials + name, and a hover tooltip
 * with their email and role (sourced from the resolved user on each row).
 */
export function AuthorizedBy({ user }: { user: PublicUser | null }) {
  if (!user) return <span className="text-muted">-</span>;
  const initials = initialsOf(user.name);

  return (
    <span className="group relative inline-flex items-center gap-2">
      <span className="grid h-6 w-6 place-items-center rounded-full bg-surface text-[10px] font-semibold text-white/80">
        {initials}
      </span>
      <span className="text-white/85">{user.name}</span>

      <span className="pointer-events-none absolute left-0 top-full z-40 mt-2 w-60 rounded-xl border border-line bg-panel p-3 opacity-0 shadow-2xl transition-opacity duration-150 group-hover:opacity-100">
        <span className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-brand/20 text-xs font-semibold text-brand">
            {initials}
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-sm text-white">{user.name}</span>
            <span className="truncate text-[11px] text-muted">{user.title}</span>
          </span>
        </span>
        <span className="mt-2 flex flex-col items-start gap-1 text-[11px]">
          <span className="text-muted">{user.email}</span>
          <span className="rounded-full bg-white/5 px-2 py-0.5 capitalize text-white/70">
            {user.role.replace("_", " ")}
          </span>
        </span>
      </span>
    </span>
  );
}
