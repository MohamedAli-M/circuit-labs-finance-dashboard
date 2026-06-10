import { Download } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { formatUSD } from "@/lib/format";
import { downloadCsv } from "@/lib/csv";
import { widgetToCsv, widgetFilename } from "@/lib/agent/exportWidget";
import type { Widget } from "@/lib/agent/types";

/** Renders one agent-generated widget (generative UI), each with Excel export. */
export function AgentWidget({ w }: { w: Widget }) {
  switch (w.type) {
    case "ranking":
      return <Ranking w={w} />;
    case "stat_cards":
      return <StatCards w={w} />;
    case "bar_chart":
      return <BarChart w={w} />;
    case "table":
      return <TableW w={w} />;
    default:
      return null;
  }
}

function ExportButton({ w }: { w: Widget }) {
  return (
    <button
      type="button"
      onClick={() => downloadCsv(widgetFilename(w), widgetToCsv(w))}
      title="Export to Excel (CSV)"
      className="inline-flex items-center gap-1 rounded-lg border border-line px-2 py-1 text-[11px] text-muted transition-colors hover:border-white/20 hover:text-white"
    >
      <Download className="h-3 w-3" /> Export
    </button>
  );
}

/** Format a numeric value by the widget's unit - dollars or a plain count. */
function fmtVal(value: number, unit?: "usd" | "count"): string {
  return unit === "count" ? value.toLocaleString("en-US") : formatUSD(value);
}

function Ranking({ w }: { w: Extract<Widget, { type: "ranking" }> }) {
  const max = Math.max(...w.items.map((i) => i.value), 1);
  return (
    <Panel title={w.title} action={<ExportButton w={w} />}>
      <div className="flex flex-col gap-2.5">
        {w.items.map((it, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand/15 text-xs font-semibold text-brand">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate text-white/90">{it.label}</span>
                <span className="shrink-0 tabular-nums text-white/70">
                  {fmtVal(it.value, w.unit)}
                  {it.sublabel ? (
                    <span className="ml-1.5 text-[11px] text-muted">{it.sublabel}</span>
                  ) : null}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-brand"
                  style={{ width: `${(it.value / max) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function StatCards({ w }: { w: Extract<Widget, { type: "stat_cards" }> }) {
  const tone = (t?: string) =>
    t === "in" ? "text-cashin" : t === "out" ? "text-cashout" : "text-white";
  return (
    <div>
      <div className="mb-2 flex justify-end">
        <ExportButton w={w} />
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {w.items.map((it, i) => (
          <div
            key={i}
            className="min-w-[150px] flex-1 rounded-2xl border border-line bg-panel p-4"
          >
            <div className={`text-2xl font-semibold tracking-tight ${tone(it.tone)}`}>
              {it.value}
            </div>
            <div className="mt-1 text-[11px] uppercase tracking-wider text-muted">
              {it.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarChart({ w }: { w: Extract<Widget, { type: "bar_chart" }> }) {
  const values = w.series.map((s) => s.value);
  const max = Math.max(...values, 0);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const zeroFromBottom = -min / range; // height fraction sitting below zero
  const hasNegative = min < 0;

  return (
    <Panel title={w.title} action={<ExportButton w={w} />}>
      <div className="relative flex h-40 items-stretch gap-1.5">
        {hasNegative && (
          <div
            className="pointer-events-none absolute inset-x-0 border-t border-dashed border-white/20"
            style={{ bottom: `${zeroFromBottom * 100}%` }}
          />
        )}
        {w.series.map((s, i) => {
          const positive = s.value >= 0;
          const frac = Math.abs(s.value) / range;
          const bottom = positive ? zeroFromBottom : zeroFromBottom - frac;
          return (
            <div key={i} className="group relative flex-1">
              <div
                className={`absolute left-1/2 w-full max-w-[26px] -translate-x-1/2 transition-opacity group-hover:opacity-80 ${
                  positive ? "rounded-t bg-brand" : "rounded-b bg-cashout"
                }`}
                style={{ height: `${frac * 100}%`, bottom: `${bottom * 100}%` }}
              >
                <span
                  className={`pointer-events-none absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-line bg-black/90 px-2 py-1 text-[10px] tabular-nums text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 ${
                    positive ? "-top-7" : "-bottom-7"
                  }`}
                >
                  {fmtVal(s.value, w.unit)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-1.5 flex gap-1.5">
        {w.series.map((s, i) => (
          <span
            key={i}
            className="flex-1 truncate text-center text-[9px] text-muted"
          >
            {s.label}
          </span>
        ))}
      </div>
    </Panel>
  );
}

function TableW({ w }: { w: Extract<Widget, { type: "table" }> }) {
  return (
    <Panel title={w.title} action={<ExportButton w={w} />}>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[10px] uppercase tracking-wider text-muted">
            {w.columns.map((c, i) => (
              <th key={i} className="pb-2 font-medium">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {w.rows.map((r, ri) => (
            <tr key={ri} className="border-t border-line/50">
              {r.map((cell, ci) => (
                <td key={ci} className="py-2 text-white/85">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}
