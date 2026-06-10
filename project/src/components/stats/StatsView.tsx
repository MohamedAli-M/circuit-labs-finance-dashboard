"use client";

import { useMemo } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import type { Transaction } from "@/lib/types";
import {
  totalCashIn,
  totalCashOut,
  topVendors,
  spendByCategory,
  spendByPerson,
  moneyInOutByMonth,
} from "@/lib/stats";
import { formatUSDCompact } from "@/lib/format";
import { KpiCard } from "./KpiCard";
import { SpendByCategory } from "./SpendByCategory";
import { TopVendors } from "./TopVendors";
import { TopSpender } from "./TopSpender";
import { MoneyInOut } from "./MoneyInOut";
import { BalanceOverTime } from "./BalanceOverTime";

export function StatsView() {
  const { data: txns, isLoading } = useSWR<Transaction[]>(
    "/api/transactions",
    fetcher,
  );

  const stats = useMemo(() => {
    const t = txns ?? [];
    return {
      cashIn: totalCashIn(t),
      cashOut: totalCashOut(t),
      vendors: topVendors(t),
      categories: spendByCategory(t),
      people: spendByPerson(t),
      months: moneyInOutByMonth(t),
    };
  }, [txns]);

  if (isLoading || !txns) {
    return (
      <div className="grid h-screen place-items-center text-muted">
        Loading stats…
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden p-6">
      <header className="mb-4 flex shrink-0 items-end justify-between">
        <h1 className="text-3xl font-light tracking-wide">STATS</h1>
        <span className="text-xs text-muted">As of May 31, 2025</span>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex min-h-0 flex-col gap-4">
          <div className="grid shrink-0 grid-cols-2 gap-4">
            <KpiCard
              label="Total cash in"
              value={formatUSDCompact(stats.cashIn)}
              tone="in"
            />
            <KpiCard
              label="Total cash out"
              value={formatUSDCompact(stats.cashOut)}
              tone="out"
            />
          </div>
          <BalanceOverTime txns={txns} />
          <MoneyInOut data={stats.months} />
        </div>

        <div className="flex min-h-0 flex-col gap-4">
          <SpendByCategory data={stats.categories} />
          <TopVendors data={stats.vendors} />
          <TopSpender data={stats.people} />
        </div>
      </div>
    </div>
  );
}
