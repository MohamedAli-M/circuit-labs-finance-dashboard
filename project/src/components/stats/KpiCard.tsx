export function KpiCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "in" | "out";
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-panel p-4">
      <div
        className={`text-3xl font-semibold tracking-tight ${
          tone === "in" ? "text-cashin" : "text-cashout"
        }`}
      >
        {value}
      </div>
      <div className="text-xs font-medium uppercase leading-tight tracking-wider text-muted">
        {label}
      </div>
    </div>
  );
}
