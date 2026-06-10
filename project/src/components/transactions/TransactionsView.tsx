"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { fetcher } from "@/lib/fetcher";
import type { Transaction, Bank, Currency, PublicUser } from "@/lib/types";
import { transactionsToCsv, downloadCsv } from "@/lib/csv";
import { FilterBar } from "./FilterBar";
import { TransactionsTable } from "./TransactionsTable";
import { TransactionModal } from "./TransactionModal";

const PAGE_SIZE = 12;

export function TransactionsView() {
  const [bank, setBank] = useState<Bank | "all">("all");
  const [authorizedBy, setAuthorizedBy] = useState("all");
  const [showCurrency, setShowCurrency] = useState<Currency | null>(null);
  const [fromDate, setFromDate] = useState("");
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [page, setPage] = useState(0);

  const query = useMemo(() => {
    const p = new URLSearchParams();
    if (bank !== "all") p.set("bank", bank);
    if (authorizedBy !== "all") p.set("authorizedBy", authorizedBy);
    if (fromDate) p.set("fromDate", fromDate);
    return p.toString();
  }, [bank, authorizedBy, fromDate]);

  // Back to page 1 whenever the filtered set changes.
  useEffect(() => setPage(0), [query]);

  const { data: rows, isLoading } = useSWR<Transaction[]>(
    `/api/transactions${query ? `?${query}` : ""}`,
    fetcher,
    { keepPreviousData: true },
  );

  const { data: allRows } = useSWR<Transaction[]>("/api/transactions", fetcher);
  const users = useMemo(() => {
    const map = new Map<string, PublicUser>();
    (allRows ?? []).forEach((t) => {
      if (t.authorizedBy) map.set(t.authorizedBy.id, t.authorizedBy);
    });
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [allRows]);

  const filtered = rows ?? [];
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const start = safePage * PAGE_SIZE;
  const visible = filtered.slice(start, start + PAGE_SIZE);

  function onExport() {
    downloadCsv("transactions.csv", transactionsToCsv(filtered, showCurrency));
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden p-6">
      <header className="mb-4 flex shrink-0 flex-wrap items-start justify-between gap-4">
        <h1 className="text-3xl font-light tracking-wide">TRANSACTIONS</h1>
        <FilterBar
          bank={bank}
          setBank={setBank}
          authorizedBy={authorizedBy}
          setAuthorizedBy={setAuthorizedBy}
          showCurrency={showCurrency}
          setShowCurrency={setShowCurrency}
          fromDate={fromDate}
          setFromDate={setFromDate}
          users={users}
          onExport={onExport}
        />
      </header>

      {isLoading && !rows ? (
        <div className="grid flex-1 place-items-center text-muted">
          Loading transactions…
        </div>
      ) : filtered.length === 0 ? (
        <div className="grid flex-1 place-items-center rounded-xl border border-line bg-panel text-muted">
          No transactions match these filters.
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <TransactionsTable
            rows={visible}
            showCurrency={showCurrency}
            onSelect={setSelected}
          />
          <div className="mt-3 flex shrink-0 items-center justify-between text-xs text-muted">
            <span>
              Showing {start + 1}-{start + visible.length} of{" "}
              {filtered.length.toLocaleString()}
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Previous page"
                disabled={safePage === 0}
                onClick={() => setPage(safePage - 1)}
                className="grid h-7 w-7 place-items-center rounded-lg border border-line text-white/80 hover:border-white/20 disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="tabular-nums">
                Page {safePage + 1} of {pageCount}
              </span>
              <button
                type="button"
                aria-label="Next page"
                disabled={safePage >= pageCount - 1}
                onClick={() => setPage(safePage + 1)}
                className="grid h-7 w-7 place-items-center rounded-lg border border-line text-white/80 hover:border-white/20 disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {selected && (
        <TransactionModal
          txn={selected}
          showCurrency={showCurrency}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
