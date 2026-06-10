import { getAllTransactions } from "@/lib/normalize";
import { toUSD } from "@/lib/currency";
import type { Transaction } from "@/lib/types";

// Query engine behind the assistant's query_transactions tool: filter + group-by
// + aggregate over the data so the model can compose arbitrary questions. USD.

export interface QueryFilters {
  bank?: string;
  type?: string; // "debit" | "credit"
  category?: string; // substring, case-insensitive
  categoryIn?: string[]; // match ANY of these exact category names
  vendor?: string; // substring, case-insensitive
  authorizedBy?: string; // user id or (partial) name
  currency?: string;
  dateFrom?: string; // YYYY-MM-DD inclusive
  dateTo?: string; // YYYY-MM-DD inclusive
  minAmountUSD?: number;
  maxAmountUSD?: number;
  pending?: boolean; // only pending / only settled
}

export type GroupBy =
  | "bank"
  | "category"
  | "vendor"
  | "authorizedBy"
  | "currency"
  | "type"
  | "month"
  | "city"; // Amex merchant city (other banks -> "Unknown")

export interface QueryParams {
  filters?: QueryFilters;
  groupBy?: GroupBy;
  metric?: "sumUSD" | "count" | "avgUSD" | "netUSD";
  sort?: "amount" | "date";
  order?: "asc" | "desc";
  limit?: number;
  includeRaw?: boolean; // include each row's raw bank record (metadata); capped
}

const raw = (t: Transaction): Record<string, unknown> =>
  t.source as unknown as Record<string, unknown>;

function isPending(t: Transaction): boolean {
  const s = raw(t);
  if (t.bank === "chase") return s.pending === true;
  return typeof s.status === "string" && s.status.toUpperCase() === "PENDING";
}

function cityOf(t: Transaction): string {
  const merchant = raw(t).merchant as Record<string, unknown> | undefined;
  return merchant && typeof merchant.city === "string" ? merchant.city : "Unknown";
}

function matches(t: Transaction, f: QueryFilters): boolean {
  if (f.bank && t.bank !== f.bank.toLowerCase()) return false;
  if (f.type && t.type !== f.type.toLowerCase()) return false;
  if (f.currency && t.currency !== f.currency.toUpperCase()) return false;
  if (f.category && !t.category.toLowerCase().includes(f.category.toLowerCase()))
    return false;
  if (f.categoryIn && f.categoryIn.length) {
    const set = f.categoryIn.map((c) => c.toLowerCase());
    if (!set.includes(t.category.toLowerCase())) return false;
  }
  if (f.vendor && !t.vendor.toLowerCase().includes(f.vendor.toLowerCase()))
    return false;
  if (f.authorizedBy) {
    const q = f.authorizedBy.toLowerCase();
    const u = t.authorizedBy;
    if (!u || !(u.id.toLowerCase() === q || u.name.toLowerCase().includes(q)))
      return false;
  }
  if (f.dateFrom && t.date < f.dateFrom) return false;
  if (f.dateTo && t.date > f.dateTo) return false;
  const usd = toUSD(t.amount, t.currency);
  if (f.minAmountUSD != null && usd < f.minAmountUSD) return false;
  if (f.maxAmountUSD != null && usd > f.maxAmountUSD) return false;
  if (f.pending != null && isPending(t) !== f.pending) return false;
  return true;
}

function groupKey(t: Transaction, by: GroupBy): string {
  switch (by) {
    case "bank": return t.bank;
    case "category": return t.category;
    case "vendor": return t.vendor;
    case "authorizedBy": return t.authorizedBy?.name ?? "Unknown";
    case "currency": return t.currency;
    case "type": return t.type;
    case "month": return t.date.slice(0, 7);
    case "city": return cityOf(t);
  }
}

function project(t: Transaction, includeRaw: boolean) {
  const base = {
    id: t.id,
    date: t.date,
    description: t.description,
    amount: t.amount,
    currency: t.currency,
    amountUSD: Math.round(toUSD(t.amount, t.currency) * 100) / 100,
    type: t.type,
    category: t.category,
    vendor: t.vendor,
    bank: t.bank,
    authorizedBy: t.authorizedBy?.name ?? null,
    pending: isPending(t),
    city: cityOf(t) === "Unknown" ? undefined : cityOf(t),
  };
  return includeRaw ? { ...base, raw: t.source } : base;
}

export function runQuery(params: QueryParams) {
  const filtered = getAllTransactions().filter((t) => matches(t, params.filters ?? {}));
  const order = params.order === "asc" ? 1 : -1;

  if (params.groupBy) {
    const groups = new Map<
      string,
      { key: string; sumUSD: number; inUSD: number; outUSD: number; count: number }
    >();
    for (const t of filtered) {
      const key = groupKey(t, params.groupBy);
      const g = groups.get(key) ?? { key, sumUSD: 0, inUSD: 0, outUSD: 0, count: 0 };
      const v = toUSD(t.amount, t.currency);
      g.sumUSD += v;
      if (t.type === "credit") g.inUSD += v;
      else g.outUSD += v;
      g.count += 1;
      groups.set(key, g);
    }
    const all = [...groups.values()];
    const metric = params.metric ?? "sumUSD";
    const round = (n: number) => Math.round(n * 100) / 100;
    const value = (g: { sumUSD: number; inUSD: number; outUSD: number; count: number }) =>
      metric === "count"
        ? g.count
        : metric === "avgUSD"
          ? g.sumUSD / g.count
          : metric === "netUSD"
            ? g.inUSD - g.outUSD
            : g.sumUSD;
    const results = all
      .map((g) => ({
        key: g.key,
        sumUSD: round(g.sumUSD),
        inUSD: round(g.inUSD),
        outUSD: round(g.outUSD),
        netUSD: round(g.inUSD - g.outUSD),
        count: g.count,
        avgUSD: round(g.sumUSD / g.count),
      }))
      .sort((a, b) => order * (value(a) - value(b)))
      .slice(0, params.limit ?? 50);
    // groupCount + totalUSD let the model compute averages with ONE division
    // instead of summing many numbers itself (which it does badly).
    return {
      kind: "grouped" as const,
      groupBy: params.groupBy,
      metric,
      groupCount: all.length,
      totalUSD: round(all.reduce((s, g) => s + g.sumUSD, 0)),
      results,
    };
  }

  const rows = [...filtered].sort((a, b) =>
    params.sort === "amount"
      ? order * (toUSD(a.amount, a.currency) - toUSD(b.amount, b.currency))
      : order * a.date.localeCompare(b.date),
  );
  const includeRaw = params.includeRaw ?? false;
  const limit = Math.min(params.limit ?? 20, includeRaw ? 10 : 100);
  return {
    kind: "list" as const,
    matchCount: filtered.length,
    totalUSD: Math.round(filtered.reduce((s, t) => s + toUSD(t.amount, t.currency), 0) * 100) / 100,
    results: rows.slice(0, limit).map((t) => project(t, includeRaw)),
  };
}
