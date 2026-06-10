import type { Widget } from "./types";

/** Convert any agent widget's underlying data to CSV (opens in Excel). */
function esc(v: string): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(rows: string[][]): string {
  return rows.map((r) => r.map(esc).join(",")).join("\n");
}

export function widgetToCsv(w: Widget): string {
  switch (w.type) {
    case "ranking":
      return toCsv([
        ["Rank", "Label", w.unit === "count" ? "Count" : "Value (USD)", "Note"],
        ...w.items.map((it, i) => [
          String(i + 1),
          it.label,
          String(it.value),
          it.sublabel ?? "",
        ]),
      ]);
    case "bar_chart":
      return toCsv([
        ["Label", w.unit === "count" ? "Count" : "Value (USD)"],
        ...w.series.map((s) => [s.label, String(s.value)]),
      ]);
    case "stat_cards":
      return toCsv([["Metric", "Value"], ...w.items.map((it) => [it.label, it.value])]);
    case "table":
      return toCsv([w.columns, ...w.rows]);
  }
}

export function widgetFilename(w: Widget): string {
  const base =
    w.type === "ranking" || w.type === "bar_chart"
      ? w.title
      : w.type === "table"
        ? w.title ?? "table"
        : "summary";
  const slug = (base || "result")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${slug || "result"}.csv`;
}
