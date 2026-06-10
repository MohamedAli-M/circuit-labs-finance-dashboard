"use client";

import type { Transaction, Currency } from "@/lib/types";
import { convert } from "@/lib/currency";
import { formatMoney, formatDate, BANK_LABELS } from "@/lib/format";
import { AuthorizedBy } from "./AuthorizedBy";

const HEADERS = [
  "Transaction",
  "Amount",
  "Date",
  "Category",
  "Bank Acc.",
  "Authorized By",
  "Vendor",
];

export function TransactionsTable({
  rows,
  showCurrency,
  onSelect,
}: {
  rows: Transaction[];
  showCurrency: Currency | null;
  onSelect: (t: Transaction) => void;
}) {
  return (
    <div className="rounded-xl border border-line bg-panel">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left text-[11px] uppercase tracking-wider text-muted">
            {HEADERS.map((h) => (
              <th key={h} className="px-4 py-3 font-medium first:pl-5">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => {
            const currency = showCurrency ?? t.currency;
            const amount = showCurrency
              ? convert(t.amount, t.currency, showCurrency)
              : t.amount;
            return (
              <tr
                key={t.id}
                onClick={() => onSelect(t)}
                className="cursor-pointer border-b border-line/50 transition-colors last:border-0 hover:bg-white/[0.03]"
              >
                <td className="py-2.5 pl-5 pr-4">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                        t.type === "credit" ? "bg-cashin" : "bg-cashout"
                      }`}
                    />
                    <span className="text-white/90">{t.description}</span>
                  </div>
                </td>
                <td className="px-4 py-2.5 tabular-nums text-white/90">
                  {formatMoney(amount, currency)}
                </td>
                <td className="px-4 py-2.5 text-muted">{formatDate(t.date)}</td>
                <td className="px-4 py-2.5 text-white/80">{t.category}</td>
                <td className="px-4 py-2.5 text-muted">{BANK_LABELS[t.bank]}</td>
                <td className="px-4 py-2.5">
                  <AuthorizedBy user={t.authorizedBy} />
                </td>
                <td className="px-4 py-2.5 text-white/80">{t.vendor}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
