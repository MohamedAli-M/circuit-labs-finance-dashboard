"use client";

import { Download } from "lucide-react";
import { Select } from "@/components/ui/Select";
import type { Bank, Currency, PublicUser } from "@/lib/types";

const CURRENCIES: Currency[] = ["USD", "EUR", "GBP", "CAD"];

export interface FilterBarProps {
  bank: Bank | "all";
  setBank: (v: Bank | "all") => void;
  authorizedBy: string;
  setAuthorizedBy: (v: string) => void;
  showCurrency: Currency | null;
  setShowCurrency: (v: Currency | null) => void;
  fromDate: string;
  setFromDate: (v: string) => void;
  users: PublicUser[];
  onExport: () => void;
}

export function FilterBar({
  bank,
  setBank,
  authorizedBy,
  setAuthorizedBy,
  showCurrency,
  setShowCurrency,
  fromDate,
  setFromDate,
  users,
  onExport,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <Select
        label="Auth. by"
        value={authorizedBy}
        options={[
          { value: "all", label: "All" },
          ...users.map((u) => ({ value: u.id, label: u.name })),
        ]}
        onChange={setAuthorizedBy}
      />
      <Select
        label="Show in"
        value={showCurrency ?? "original"}
        options={[
          { value: "original", label: "Original" },
          ...CURRENCIES.map((c) => ({ value: c, label: c })),
        ]}
        onChange={(v) => setShowCurrency(v === "original" ? null : (v as Currency))}
      />
      <Select
        label="Bank"
        value={bank}
        options={[
          { value: "all", label: "All" },
          { value: "chase", label: "Chase" },
          { value: "boa", label: "BoA" },
          { value: "amex", label: "Amex" },
        ]}
        onChange={(v) => setBank(v as Bank | "all")}
      />
      <button
        type="button"
        onClick={onExport}
        className="flex items-center gap-2 rounded-lg border border-line bg-surface/60 px-3.5 py-2 text-xs font-medium text-white/90 transition-colors hover:border-white/20"
      >
        <Download className="h-4 w-4" />
        CSV
      </button>
      <input
        type="date"
        value={fromDate}
        onChange={(e) => setFromDate(e.target.value)}
        aria-label="From date"
        className="rounded-lg border border-line bg-surface/60 px-3 py-2 text-xs text-white/90 [color-scheme:dark]"
      />
    </div>
  );
}
