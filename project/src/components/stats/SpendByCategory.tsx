import { Panel } from "@/components/ui/Panel";
import { formatUSD } from "@/lib/format";
import type { CategoryStat } from "@/lib/stats";

export function SpendByCategory({ data }: { data: CategoryStat[] }) {
  const top = data.slice(0, 5);
  const max = Math.max(...top.map((d) => d.total), 1);
  return (
    <Panel title="Where does your money go?">
      <div className="flex flex-col gap-2.5">
        {top.map((d) => (
          <div key={d.category}>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="text-white/85">{d.category}</span>
              <span className="tabular-nums text-muted">{formatUSD(d.total)}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full bg-cashin"
                style={{ width: `${(d.total / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
