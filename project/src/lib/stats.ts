import type { Transaction, Bank, PublicUser } from "./types";
import { toUSD } from "./currency";

// Stats aggregations, summed in USD (mixed currencies aren't additive).
// "Spend" = debits only. These also back the assistant's query tools.

const usd = (t: Transaction): number => toUSD(t.amount, t.currency);

export function totalCashIn(txns: Transaction[]): number {
  return txns.filter((t) => t.type === "credit").reduce((s, t) => s + usd(t), 0);
}

export function totalCashOut(txns: Transaction[]): number {
  return txns.filter((t) => t.type === "debit").reduce((s, t) => s + usd(t), 0);
}

export function netCashFlow(txns: Transaction[]): number {
  return totalCashIn(txns) - totalCashOut(txns);
}

export function uniqueVendorCount(txns: Transaction[]): number {
  return new Set(txns.map((t) => t.vendor)).size;
}

export interface VendorStat {
  vendor: string;
  total: number;
  count: number;
  lastDate: string;
}

export function topVendors(txns: Transaction[], limit?: number): VendorStat[] {
  const m = new Map<string, VendorStat>();
  for (const t of txns) {
    if (t.type !== "debit") continue; // spend = debits
    const cur =
      m.get(t.vendor) ?? { vendor: t.vendor, total: 0, count: 0, lastDate: t.date };
    cur.total += usd(t);
    cur.count += 1;
    if (t.date > cur.lastDate) cur.lastDate = t.date;
    m.set(t.vendor, cur);
  }
  const arr = [...m.values()].sort((a, b) => b.total - a.total);
  return limit ? arr.slice(0, limit) : arr;
}

export interface CategoryStat {
  category: string;
  total: number;
}

export function spendByCategory(txns: Transaction[]): CategoryStat[] {
  const m = new Map<string, number>();
  for (const t of txns) {
    if (t.type !== "debit") continue;
    m.set(t.category, (m.get(t.category) ?? 0) + usd(t));
  }
  return [...m.entries()]
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
}

export interface PersonStat {
  user: PublicUser;
  total: number;
}

export function spendByPerson(txns: Transaction[]): PersonStat[] {
  const m = new Map<string, PersonStat>();
  for (const t of txns) {
    if (t.type !== "debit" || !t.authorizedBy) continue;
    const cur = m.get(t.authorizedBy.id) ?? { user: t.authorizedBy, total: 0 };
    cur.total += usd(t);
    m.set(t.authorizedBy.id, cur);
  }
  return [...m.values()].sort((a, b) => b.total - a.total);
}

export interface MonthFlow {
  month: string; // YYYY-MM
  in: number;
  out: number;
}

export function moneyInOutByMonth(txns: Transaction[]): MonthFlow[] {
  const m = new Map<string, MonthFlow>();
  for (const t of txns) {
    const key = t.date.slice(0, 7);
    const cur = m.get(key) ?? { month: key, in: 0, out: 0 };
    if (t.type === "credit") cur.in += usd(t);
    else cur.out += usd(t);
    m.set(key, cur);
  }
  return [...m.values()].sort((a, b) => a.month.localeCompare(b.month));
}

export interface BalancePoint {
  month: string;
  balance: number;
}

// Per-bank running balance by month, from 0 (shows trajectory, not an absolute balance).
export function balanceByMonth(txns: Transaction[], bank: Bank): BalancePoint[] {
  const flows = moneyInOutByMonth(txns.filter((t) => t.bank === bank));
  let balance = 0;
  return flows.map((f) => {
    balance += f.in - f.out;
    return { month: f.month, balance };
  });
}
