import { Panel } from "@/components/ui/Panel";
import { formatUSD } from "@/lib/format";
import type { PersonStat } from "@/lib/stats";

const COLORS = ["#2D7FF9", "#FF383C", "#00D55C", "#F5A623", "#A855F7"];

export function TopSpender({ data }: { data: PersonStat[] }) {
  const total = data.reduce((s, d) => s + d.total, 0) || 1;
  return (
    <Panel title="Top spender">
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-white/5">
        {data.map((d, i) => (
          <div
            key={d.user.id}
            style={{
              width: `${(d.total / total) * 100}%`,
              background: COLORS[i % COLORS.length],
            }}
          />
        ))}
      </div>
      <div className="mt-4 flex flex-col gap-2">
        {data.map((d, i) => (
          <div
            key={d.user.id}
            className="flex items-center justify-between text-sm"
          >
            <span className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: COLORS[i % COLORS.length] }}
              />
              <span className="text-white/85">{d.user.name}</span>
            </span>
            <span className="tabular-nums text-muted">{formatUSD(d.total)}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}
