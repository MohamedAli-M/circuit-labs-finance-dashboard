"use client";

import { useState } from "react";
import { Panel } from "@/components/ui/Panel";
import { Select } from "@/components/ui/Select";
import { balanceByMonth } from "@/lib/stats";
import { formatMonth, formatUSDCompact } from "@/lib/format";
import type { Transaction, Bank } from "@/lib/types";

const W = 520;
const H = 128;
const PAD_X = 6;
const PAD_Y = 14;

export function BalanceOverTime({ txns }: { txns: Transaction[] }) {
  const [bank, setBank] = useState<Bank>("boa");
  const points = balanceByMonth(txns, bank);

  const values = points.map((p) => p.balance);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 1);

  const x = (i: number) =>
    points.length > 1
      ? PAD_X + (i / (points.length - 1)) * (W - 2 * PAD_X)
      : W / 2;
  const y = (v: number) =>
    H - PAD_Y - ((v - min) / (max - min || 1)) * (H - 2 * PAD_Y);

  const line = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(p.balance).toFixed(1)}`)
    .join(" ");
  const area = points.length
    ? `${line} L ${x(points.length - 1).toFixed(1)} ${H - PAD_Y} L ${x(0).toFixed(1)} ${H - PAD_Y} Z`
    : "";

  return (
    <Panel
      title="Bank account balance"
      action={
        <Select
          label=""
          value={bank}
          options={[
            { value: "chase", label: "Chase" },
            { value: "boa", label: "BoA" },
            { value: "amex", label: "Amex" },
          ]}
          onChange={(v) => setBank(v as Bank)}
        />
      }
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height: H }}
      >
        <defs>
          <linearGradient id="balfill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#2D7FF9" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#2D7FF9" stopOpacity="0" />
          </linearGradient>
        </defs>
        {area && <path d={area} fill="url(#balfill)" />}
        <path
          d={line}
          fill="none"
          stroke="#2D7FF9"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-muted">
        <span>{points[0] ? formatMonth(points[0].month) : ""}</span>
        <span>peak {formatUSDCompact(max)}</span>
        <span>
          {points.length ? formatMonth(points[points.length - 1].month) : ""}
        </span>
      </div>
    </Panel>
  );
}
