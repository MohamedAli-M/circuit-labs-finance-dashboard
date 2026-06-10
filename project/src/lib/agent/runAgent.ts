import OpenAI from "openai";
import { TOOL_DEFS, DISPLAY_TOOLS, executeTool } from "./tools";
import type { ChatMessage, ToolTrace, Widget, AgentResult } from "./types";

export type { ChatMessage } from "./types";

const SYSTEM_PROMPT = `You are "Ask Circuit", the finance analyst assistant for Circuit Labs Inc.

THE DATA
- 1,800 transactions across THREE accounts: Chase (business checking), Bank of America (treasury), American Express (business card). June 2023 to May 2025.
- Original currencies: USD, EUR, GBP, CAD. All sums are in USD unless the user asks for an original currency.
- Each transaction has: date, description, amount + currency, type (debit/credit), category, vendor, bank, who authorized it, and a raw bank record with extra metadata (merchant city/state, MCC, pending status, running balance, posting dates) reachable via includeRaw or get_transaction.
- Account-level metadata (balances, statement periods, masked numbers, card type, payment due) is available via get_accounts.

WHO AUTHORIZES TRANSACTIONS (4 people)
- Alex Rivera (CEO), Priya Shah (Head of Finance), Marcus Chen (Analyst), Jordan Lee (Engineering Manager).

CATEGORIES (24, and NOT standardized across banks - combine related ones with filters.categoryIn):
- Software / Tech: SaaS, Computer Services, Infrastructure, Electronics, Equipment
- Travel: Travel, Airline, Lodging, Transportation
- Food: Dining, Restaurant
- Marketing: Marketing, Advertising
- Payments / Fees: Payment, Payment Processing, Fees
- Income (credits): Revenue, Funding, Investment
- Operations: Legal, Contractors, Utilities, Office, Payroll
(There are 87 vendors - e.g. AWS, WeWork, Sequoia Capital, Stripe, Google Ads, ADP. To find others use groupBy:"vendor" or a vendor substring. If unsure what categories exist, call query_transactions with groupBy:"category".)

GETTING THE DATA
- query_transactions answers any quantitative question - compose filters + groupBy/metric. groupBy supports: bank, category, vendor, authorizedBy, currency, type, month, and city (city = Amex merchant city; add filter bank:amex for city questions). filters.pending:true limits to pending. get_accounts gives balances/statements; get_transaction gives one record's raw detail.
- "spend"/"cost"/"paid" = type:debit. "income"/"cash in"/"revenue" = type:credit. A vendor or category can be BOTH in and out (e.g. Sequoia has funding credits AND debits) - query BOTH directions before concluding which.
- Every grouped result includes sumUSD, inUSD, outUSD, netUSD and count per group. "Cash flow" and comparing accounts means NET (netUSD = credits minus debits), NOT total magnitude. IMPORTANT: the three banks share the same transaction AMOUNTS, so sumUSD is identical across banks and useless for comparison - compare with netUSD or in vs out (Chase and BoA are inflow accounts, Amex is the spending card).

ACCURACY - this is a finance tool; a wrong number is worse than no answer:
- Every number you output MUST be copied EXACTLY from a tool result. NEVER round to a clean figure (cash in is $16,703,712 - never "$20,000,000" or "$20M") and NEVER invent one. This applies especially to stat-card values.
- All tool sums are in US dollars. Always label them with "$" as USD - NEVER attach € or £ to a tool sum. (If asked about spend "in EUR", the USD total is the honest answer; call it the USD equivalent.)
- Do NOT do mental arithmetic over many numbers. For an average like monthly burn, read totalUSD and groupCount from a grouped result and divide those two - show that figure.
- If the tools can't answer (the data isn't there - e.g. headcount, stock price, profit margin), say so plainly. Never guess.

PRESENTING - be a product, not a wall of text:
- Top-N / best / biggest / most -> show_ranking. Headline totals -> show_stat_cards. Trends over time -> show_bar_chart. Detailed rows -> show_table (<= 10 rows).
- If a chart or ranking shows COUNTS of transactions (e.g. "transaction volume by month" via metric:count), set unit:"count" so it renders as plain numbers, NOT dollars.
- ALWAYS finish your answer by calling suggest_followups with 2-3 short, relevant next questions.

STYLE
- Do not use em dashes in your writing. Use commas, parentheses, or separate sentences instead.
- The numbers live in the widget. Then write AT MOST one short sentence. NEVER re-list the widget's numbers as text or markdown bullets.`;

export function hasApiKey(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

/** Guarantee the assistant never emits an em dash (U+2014); swap it for a comma. */
const EM_DASH = String.fromCharCode(0x2014);
function stripDashes(s: string): string {
  return s.replace(new RegExp("\\s*" + EM_DASH + "\\s*", "g"), ", ");
}

function toWidget(name: string, args: Record<string, unknown>): Widget | null {
  const arr = (v: unknown): Record<string, unknown>[] =>
    Array.isArray(v) ? (v as Record<string, unknown>[]) : [];
  try {
    if (name === "show_ranking") {
      return {
        type: "ranking",
        title: stripDashes(String(args.title ?? "")),
        unit: args.unit === "count" ? "count" : "usd",
        items: arr(args.items).map((x) => ({
          label: String(x.label ?? ""),
          value: Number(x.value ?? 0),
          sublabel: x.sublabel != null ? String(x.sublabel) : undefined,
        })),
      };
    }
    if (name === "show_stat_cards") {
      return {
        type: "stat_cards",
        items: arr(args.items).map((x) => ({
          label: String(x.label ?? ""),
          value: String(x.value ?? ""),
          tone: x.tone === "in" || x.tone === "out" ? x.tone : "neutral",
        })),
      };
    }
    if (name === "show_bar_chart") {
      return {
        type: "bar_chart",
        title: stripDashes(String(args.title ?? "")),
        unit: args.unit === "count" ? "count" : "usd",
        series: arr(args.series).map((x) => ({
          label: String(x.label ?? ""),
          value: Number(x.value ?? 0),
        })),
      };
    }
    if (name === "show_table") {
      return {
        type: "table",
        title: args.title != null ? stripDashes(String(args.title)) : undefined,
        columns: arr(args.columns).map(String) as unknown as string[],
        rows: (Array.isArray(args.rows) ? args.rows : []).map((r) =>
          Array.isArray(r) ? r.map(String) : [],
        ),
      };
    }
  } catch {
    return null;
  }
  return null;
}

export async function runAgent(history: ChatMessage[]): Promise<AgentResult> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const model = process.env.OPENAI_MODEL ?? "gpt-5.4-mini";
  const effort = (process.env.OPENAI_REASONING_EFFORT ?? "medium") as
    | "low"
    | "medium"
    | "high";

  // Tools use the Responses API's flat function shape.
  const tools = TOOL_DEFS.map((t) => {
    const fn = (t as OpenAI.Chat.Completions.ChatCompletionFunctionTool).function;
    return {
      type: "function" as const,
      name: fn.name,
      description: fn.description ?? null,
      parameters: fn.parameters ?? {},
      strict: false,
    };
  }) as OpenAI.Responses.Tool[];

  const trace: ToolTrace[] = [];
  const widgets: Widget[] = [];
  const followups: string[] = [];

  // Turn 1 sends the conversation; later turns send only the tool outputs, with
  // previous_response_id so the model keeps its prior reasoning + call context.
  let input: OpenAI.Responses.ResponseInputItem[] = history.map((m) => ({
    role: m.role,
    content: m.content,
  }));
  let previousResponseId: string | undefined;

  for (let step = 0; step < 6; step++) {
    const res = await client.responses.create({
      model,
      instructions: SYSTEM_PROMPT,
      input,
      tools,
      reasoning: { effort },
      previous_response_id: previousResponseId,
    });
    previousResponseId = res.id;

    const calls = res.output.filter(
      (o): o is OpenAI.Responses.ResponseFunctionToolCall =>
        o.type === "function_call",
    );

    if (calls.length === 0) {
      return { reply: stripDashes(res.output_text ?? ""), trace, widgets, followups };
    }

    const outputs: OpenAI.Responses.ResponseInputItem[] = [];
    for (const call of calls) {
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(call.arguments || "{}");
      } catch {
        args = {};
      }

      let result: unknown = { ok: true };
      if (call.name === "suggest_followups") {
        const qs = Array.isArray(args.questions)
          ? args.questions.map((q) => stripDashes(String(q)))
          : [];
        followups.push(...qs);
      } else if (DISPLAY_TOOLS.has(call.name)) {
        const widget = toWidget(call.name, args);
        if (widget) widgets.push(widget);
      } else {
        trace.push({ name: call.name, args });
        result = executeTool(call.name, args);
      }

      outputs.push({
        type: "function_call_output",
        call_id: call.call_id,
        output: JSON.stringify(result),
      });
    }

    input = outputs;
  }

  return {
    reply: "I couldn't finish that in a few steps. Try narrowing the question.",
    trace,
    widgets,
    followups,
  };
}
