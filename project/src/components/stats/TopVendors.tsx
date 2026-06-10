import { Panel } from "@/components/ui/Panel";
import { formatUSD, formatDate } from "@/lib/format";
import type { VendorStat } from "@/lib/stats";

export function TopVendors({ data }: { data: VendorStat[] }) {
  const top = data.slice(0, 5);
  return (
    <Panel title="Top paid vendors">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[10px] uppercase tracking-wider text-muted">
            <th className="pb-2 font-medium">Vendor</th>
            <th className="pb-2 font-medium">Last transaction</th>
            <th className="pb-2 text-right font-medium">Total</th>
          </tr>
        </thead>
        <tbody>
          {top.map((v) => (
            <tr key={v.vendor} className="border-t border-line/50">
              <td className="py-2.5 text-white/90">{v.vendor}</td>
              <td className="py-2.5 text-muted">{formatDate(v.lastDate)}</td>
              <td className="py-2.5 text-right tabular-nums text-white/90">
                {formatUSD(v.total)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}
