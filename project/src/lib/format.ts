import type { Bank, Currency } from "./types";

/**
 * Display formatting helpers. Kept out of components so the table, modal, charts
 * and CSV all show money and dates identically.
 */

/** e.g. (12480, "USD") -> "USD $12,480.00". Matches the brief's display style. */
export function formatMoney(amount: number, currency: Currency): string {
  return `${currency} $${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Full USD, no cents: 16703712 -> "$16,703,712". */
export function formatUSD(n: number): string {
  const v = Math.round(n);
  return v < 0
    ? `-$${Math.abs(v).toLocaleString("en-US")}`
    : `$${v.toLocaleString("en-US")}`;
}

/** Compact USD for KPIs/axes: 16703712 -> "$16.7M", 928500 -> "$928.5K". */
export function formatUSDCompact(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(1)}K`;
  return `${sign}$${abs.toFixed(0)}`;
}

/** "2024-09-12" -> "Sep 12, 2024". Parsed by hand to stay timezone-safe. */
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

/** "2024-09" -> "Sep '24" for chart axes. */
export function formatMonth(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return `${MONTHS[m - 1]} '${String(y).slice(2)}`;
}

/** Bank → display label with the real masked account number (from each file's metadata). */
export const BANK_LABELS: Record<Bank, string> = {
  chase: "Chase ••••4821",
  boa: "BoA ••••7892",
  amex: "Amex ••••31008",
};
