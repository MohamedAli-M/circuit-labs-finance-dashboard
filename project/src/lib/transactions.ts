import { getAllTransactions } from "./normalize";
import { toUSD } from "./currency";
import type { Transaction } from "./types";

// Filtering for /api/transactions, on top of the normalized, sorted list.
export interface TxQuery {
  bank?: string; // "chase" | "boa" | "amex"
  authorizedBy?: string; // a user id, e.g. "usr_001"
  amount?: string; // minimum amount, compared in USD (see note below)
  fromDate?: string; // YYYY-MM-DD, inclusive
}

export function queryTransactions(q: TxQuery): Transaction[] {
  let txns = getAllTransactions(); // already earliest-first

  if (q.bank) {
    txns = txns.filter((t) => t.bank === q.bank);
  }
  if (q.authorizedBy) {
    txns = txns.filter((t) => t.authorizedBy?.id === q.authorizedBy);
  }
  if (q.fromDate) {
    const from = q.fromDate;
    txns = txns.filter((t) => t.date >= from); // ISO strings compare chronologically
  }
  if (q.amount) {
    // No currency specified and rows are mixed, so compare in USD.
    const min = Number(q.amount);
    if (!Number.isNaN(min)) {
      txns = txns.filter((t) => toUSD(t.amount, t.currency) >= min);
    }
  }

  return txns;
}
