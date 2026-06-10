/** Shared agent types - no server-only imports, safe for the client to use. */

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ToolTrace {
  name: string;
  args: unknown;
}

/** Visual outputs the agent renders via its presentation tools (generative UI). */
export type Widget =
  | {
      type: "ranking";
      title: string;
      unit?: "usd" | "count";
      items: { label: string; value: number; sublabel?: string }[];
    }
  | {
      type: "bar_chart";
      title: string;
      unit?: "usd" | "count";
      series: { label: string; value: number }[];
    }
  | {
      type: "stat_cards";
      items: { label: string; value: string; tone?: "in" | "out" | "neutral" }[];
    }
  | { type: "table"; title?: string; columns: string[]; rows: string[][] };

export interface AgentResult {
  reply: string;
  trace: ToolTrace[];
  widgets: Widget[];
  followups: string[];
  needsKey?: boolean;
}
