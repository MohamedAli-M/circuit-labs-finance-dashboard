import OpenAI from "openai";
import { runQuery, type QueryParams } from "./query";
import { getAccounts } from "./accounts";
import { getTransactionById } from "@/lib/normalize";

/** The three composable tools the model can call. */
export const TOOL_DEFS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "query_transactions",
      description:
        "Filter / group / aggregate the company's 1,800 transactions. Use for ANY quantitative question (totals, top-N, breakdowns, lookups, comparisons). Money is summed in USD. Set groupBy to aggregate into buckets; omit it to list matching transactions. Set includeRaw:true to read raw bank metadata fields on each row.",
      parameters: {
        type: "object",
        properties: {
          filters: {
            type: "object",
            properties: {
              bank: { type: "string", enum: ["chase", "boa", "amex"] },
              type: {
                type: "string",
                enum: ["debit", "credit"],
                description: "debit = money out / spend, credit = money in",
              },
              category: { type: "string", description: "case-insensitive substring of one category" },
              categoryIn: {
                type: "array",
                items: { type: "string" },
                description:
                  "match ANY of these exact category names - use to COMBINE the unconformed categories, e.g. ['SaaS','Computer Services','Infrastructure'] for 'software'",
              },
              vendor: { type: "string", description: "case-insensitive substring, e.g. 'AWS'" },
              authorizedBy: { type: "string", description: "user id (e.g. usr_002) or a person name (e.g. 'Priya')" },
              currency: { type: "string", enum: ["USD", "EUR", "GBP", "CAD"], description: "the ORIGINAL currency of the transaction" },
              dateFrom: { type: "string", description: "YYYY-MM-DD inclusive" },
              dateTo: { type: "string", description: "YYYY-MM-DD inclusive" },
              minAmountUSD: { type: "number" },
              maxAmountUSD: { type: "number" },
              pending: { type: "boolean", description: "true = only pending transactions, false = only settled" },
            },
          },
          groupBy: {
            type: "string",
            enum: ["bank", "category", "vendor", "authorizedBy", "currency", "type", "month", "city"],
            description: "city = Amex merchant city (filter bank:amex for city questions)",
          },
          metric: { type: "string", enum: ["sumUSD", "count", "avgUSD", "netUSD"], description: "how to rank groups; default sumUSD. netUSD = credits minus debits (true cash flow)" },
          sort: { type: "string", enum: ["amount", "date"], description: "list mode ordering" },
          order: { type: "string", enum: ["asc", "desc"] },
          limit: { type: "number" },
          includeRaw: { type: "boolean", description: "include raw bank metadata per row (capped at 10 rows)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_accounts",
      description:
        "Account-level metadata for all three banks: balances, statement periods, masked account numbers, routing, card type, payment due. Use for questions about accounts/balances/statements rather than individual transactions.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_transaction",
      description:
        "One transaction's full detail including its raw bank record (merchant city/state, MCC code, pending status, running balance, posting date, etc.). Use after finding an id via query_transactions.",
      parameters: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
      },
    },
  },

  // --- Presentation tools (generative UI). The model calls these to RENDER an
  // answer visually instead of writing markdown. Their args become widgets. ---
  {
    type: "function",
    function: {
      name: "show_ranking",
      description:
        "Render a visual ranked list (numbered, with bars). Use for top-N / 'best' / 'biggest' / 'most' questions. Set unit:'count' if the values are transaction counts rather than dollars.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          unit: { type: "string", enum: ["usd", "count"], description: "what the values are; default usd" },
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                label: { type: "string" },
                value: { type: "number" },
                sublabel: { type: "string", description: "optional small note, e.g. '24 txns'" },
              },
              required: ["label", "value"],
            },
          },
        },
        required: ["title", "items"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "show_stat_cards",
      description:
        "Render headline stat cards. Use for totals / KPIs like cash in vs out. `value` is a preformatted string (e.g. '$16.7M'). tone: in (green) / out (red) / neutral.",
      parameters: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                label: { type: "string" },
                value: { type: "string" },
                tone: { type: "string", enum: ["in", "out", "neutral"] },
              },
              required: ["label", "value"],
            },
          },
        },
        required: ["items"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "show_bar_chart",
      description:
        "Render a bar chart. Use for trends or comparisons over time / across groups. Set unit:'count' when the bars are transaction counts (e.g. 'transaction volume by month') rather than dollars.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          unit: { type: "string", enum: ["usd", "count"], description: "what the values are; default usd" },
          series: {
            type: "array",
            items: {
              type: "object",
              properties: { label: { type: "string" }, value: { type: "number" } },
              required: ["label", "value"],
            },
          },
        },
        required: ["title", "series"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "show_table",
      description: "Render a small table (<= 10 rows) for detailed rows.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          columns: { type: "array", items: { type: "string" } },
          rows: { type: "array", items: { type: "array", items: { type: "string" } } },
        },
        required: ["columns", "rows"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "suggest_followups",
      description:
        "Provide 2-3 short, relevant follow-up questions the user might ask next. Call this at the END of every answer.",
      parameters: {
        type: "object",
        properties: {
          questions: {
            type: "array",
            items: { type: "string" },
            description: "2-3 concise next questions",
          },
        },
        required: ["questions"],
      },
    },
  },
];

/** Names of presentation tools - handled as widgets, not executed for data. */
export const DISPLAY_TOOLS = new Set([
  "show_ranking",
  "show_stat_cards",
  "show_bar_chart",
  "show_table",
]);

/** Execute a tool call against the real data. */
export function executeTool(name: string, args: Record<string, unknown>): unknown {
  switch (name) {
    case "query_transactions":
      return runQuery(args as QueryParams);
    case "get_accounts":
      return getAccounts();
    case "get_transaction": {
      const id = String(args.id ?? "");
      return getTransactionById(id) ?? { error: `No transaction with id ${id}` };
    }
    default:
      return { error: `Unknown tool: ${name}` };
  }
}
