import type { Role, Tab } from "./types";

/**
 * Tab access rules. Mirrors data/users/user.json's `tabAccessMatrix`, kept here
 * so the client can gate the nav and routes without a round-trip.
 */
export const TAB_ACCESS: Record<Tab, Role[]> = {
  transactions: ["admin", "finance_lead", "viewer"],
  stats: ["admin", "finance_lead", "analyst"],
  custom: ["admin", "finance_lead"],
};

/** Display order for the nav rail. */
export const TAB_ORDER: Tab[] = ["transactions", "stats", "custom"];

export function canAccess(role: Role, tab: Tab): boolean {
  return TAB_ACCESS[tab].includes(role);
}

/** The tabs a role may see, in display order. */
export function allowedTabs(role: Role): Tab[] {
  return TAB_ORDER.filter((tab) => canAccess(role, tab));
}
