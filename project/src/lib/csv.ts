import type { Transaction, Currency } from "./types";
import { convert } from "./currency";

/**
 * CSV export. Exports EVERY row passed in (i.e. the full filtered set, not just
 * the 30 shown in the table). Columns mirror the table.
 */
const HEADER = [
  "Transaction",
  "Amount",
  "Currency",
  "Date",
  "Category",
  "Bank",
  "Authorized By",
  "Vendor",
];

export function transactionsToCsv(
  txns: Transaction[],
  displayCurrency: Currency | null,
): string {
  const lines = txns.map((t) => {
    const currency = displayCurrency ?? t.currency;
    const amount = displayCurrency
      ? convert(t.amount, t.currency, displayCurrency)
      : t.amount;
    return [
      t.description,
      amount.toFixed(2),
      currency,
      t.date,
      t.category,
      t.bank,
      t.authorizedBy?.name ?? "-",
      t.vendor,
    ]
      .map(cell)
      .join(",");
  });
  return [HEADER.join(","), ...lines].join("\n");
}

/** Quote a CSV cell only if it contains a comma, quote or newline. */
function cell(value: string): string {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
