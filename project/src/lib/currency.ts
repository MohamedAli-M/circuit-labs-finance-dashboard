import type { Currency } from "./types";
import ratesFile from "../../data/rates.json";

// Rates from data/rates.json (fixed). Each is the USD value of one unit, so to
// USD you multiply (CAD is 0.74, which is the tell that it's multiply, not divide).
const RATES = ratesFile.rates as Record<Currency, number>;

export function toUSD(amount: number, currency: Currency): number {
  return amount * RATES[currency];
}

// Any currency to any other, via USD. Used by the table's "show currency in".
export function convert(amount: number, from: Currency, to: Currency): number {
  if (from === to) return amount;
  return (amount * RATES[from]) / RATES[to];
}
