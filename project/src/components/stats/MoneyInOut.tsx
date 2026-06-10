import { Panel } from "@/components/ui/Panel";
import { formatMonth, formatUSD } from "@/lib/format";
import type { MonthFlow } from "@/lib/stats";

export function MoneyInOut({ data }: { data: MonthFlow[] }) {
  const months = data.slice(-12); // last 12 months for readability
  const max = Math.max(...months.flatMap((m) => [m.in, m.out]), 1);

  return (
    <Panel
      title="Money in vs money out"
      action={
        <div className="flex items-center gap-4 text-[11px] text-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-cashin" /> In
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-cashout" /> Out
          </span>
        </div>
      }
    >
      <div className="flex h-32 items-end gap-1.5">
        {months.map((m) => (
          <div
            key={m.month}
            className="group relative flex flex-1 flex-col items-center gap-1.5"
          >
            <div className="flex h-24 w-full items-end justify-center gap-0.5">
              <div
                className="w-1/2 rounded-t bg-cashin transition-opacity group-hover:opacity-90"
                style={{ height: `${(m.in / max) * 100}%` }}
              />
              <div
                className="w-1/2 rounded-t bg-cashout transition-opacity group-hover:opacity-90"
                style={{ height: `${(m.out / max) * 100}%` }}
              />
            </div>
            <span className="text-[9px] text-muted">
              {formatMonth(m.month).slice(0, 3)}
            </span>

            {/* hover tooltip: month + both values */}
            <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 whitespace-nowrap rounded-md border border-line bg-black/90 px-2 py-1 text-[10px] opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
              <div className="mb-0.5 font-medium text-white">
                {formatMonth(m.month)}
              </div>
              <div className="tabular-nums text-cashin">In {formatUSD(m.in)}</div>
              <div className="tabular-nums text-cashout">Out {formatUSD(m.out)}</div>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
