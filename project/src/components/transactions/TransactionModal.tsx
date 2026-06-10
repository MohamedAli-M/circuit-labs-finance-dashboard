"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import type { Transaction, Currency } from "@/lib/types";
import { convert } from "@/lib/currency";
import { formatMoney, formatDate, BANK_LABELS } from "@/lib/format";

export function TransactionModal({
  txn,
  showCurrency,
  onClose,
}: {
  txn: Transaction;
  showCurrency: Currency | null;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const currency = showCurrency ?? txn.currency;
  const amount = showCurrency
    ? convert(txn.amount, txn.currency, showCurrency)
    : txn.amount;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-auto rounded-2xl border border-line bg-panel p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="truncate text-lg text-white">{txn.description}</h2>
            <p className="truncate text-xs text-muted">{txn.vendor}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 text-muted transition-colors hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div
          className={`mt-4 text-2xl font-light ${
            txn.type === "credit" ? "text-cashin" : "text-white"
          }`}
        >
          {txn.type === "credit" ? "+ " : "− "}
          {formatMoney(amount, currency)}
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-3">
          <Item label="Date" value={formatDate(txn.date)} />
          <Item label="Category" value={txn.category} />
          <Item label="Bank account" value={BANK_LABELS[txn.bank]} />
          <Item label="Type" value={txn.type} capitalize />
          <Item label="Authorized by" value={txn.authorizedBy?.name ?? "-"} />
          <Item label="Original" value={formatMoney(txn.amount, txn.currency)} />
        </dl>

        <div className="mt-5 border-t border-line pt-4">
          <p className="mb-2 text-[11px] uppercase tracking-wider text-muted">
            Raw bank data
          </p>
          <dl className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(txn.source).map(([k, v]) => {
              const display =
                v !== null && typeof v === "object" ? JSON.stringify(v) : String(v);
              return (
                <div key={k} className="min-w-0">
                  <dt className="text-muted">{k}</dt>
                  <dd className="truncate text-white/80" title={display}>
                    {display}
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>
      </div>
    </div>
  );
}

function Item({
  label,
  value,
  capitalize,
}: {
  label: string;
  value: string;
  capitalize?: boolean;
}) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wider text-muted">{label}</dt>
      <dd className={`text-white/90 ${capitalize ? "capitalize" : ""}`}>{value}</dd>
    </div>
  );
}
