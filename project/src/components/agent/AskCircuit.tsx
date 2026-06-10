"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, RotateCcw, Send, Wrench } from "lucide-react";
import type { Widget } from "@/lib/agent/types";
import { AgentWidget } from "./AgentWidgets";

interface Trace {
  name: string;
  args: unknown;
}
interface UiMessage {
  role: "user" | "assistant";
  content: string;
  trace?: Trace[];
  widgets?: Widget[];
  followups?: string[];
}

const SUGGESTIONS = [
  "Total cash in vs cash out?",
  "Top 5 vendors by spend",
  "Largest transaction - who authorized it?",
  "How much did we spend on software?",
  "What's BoA's current balance?",
];

export function AskCircuit() {
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsKey, setNeedsKey] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || loading) return;
    const next: UiMessage[] = [...messages, { role: "user", content: q }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      if (data.needsKey) setNeedsKey(true);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: data.reply ?? "",
          trace: data.trace,
          widgets: data.widgets,
          followups: data.followups,
        },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Something went wrong reaching the assistant." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen flex-col p-8">
      <header className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-light tracking-wide">ASK CIRCUIT</h1>
          <p className="text-xs text-muted">
            AI finance assistant · answers only from your live transaction data
          </p>
        </div>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setMessages([]);
              setInput("");
            }}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs text-muted transition-colors hover:border-white/20 hover:text-white"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
        )}
      </header>

      {needsKey && (
        <div className="mb-4 rounded-xl border border-brand/30 bg-brand/10 px-4 py-3 text-sm text-white/80">
          Add <code className="text-brand">OPENAI_API_KEY</code> to{" "}
          <code>.env.local</code> and restart the dev server to enable live answers.
        </div>
      )}

      <div
        ref={scrollRef}
        className="flex-1 overflow-auto rounded-2xl border border-line bg-panel p-5"
      >
        {messages.length === 0 ? (
          <Empty onPick={send} />
        ) : (
          <div className="flex flex-col gap-5">
            {messages.map((m, i) => (
              <Bubble key={i} msg={m} />
            ))}
            {loading && <Thinking />}
            {!loading &&
              messages.length > 0 &&
              messages[messages.length - 1].role === "assistant" &&
              (messages[messages.length - 1].followups?.length ?? 0) > 0 && (
                <Followups
                  questions={messages[messages.length - 1].followups!}
                  onPick={send}
                />
              )}
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="mt-4 flex items-center gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about spend, vendors, balances, anyone's transactions…"
          className="flex-1 rounded-xl border border-line bg-surface/60 px-4 py-3 text-sm text-white placeholder:text-muted focus:border-brand/50 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand text-white transition-opacity disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}

function Empty({ onPick }: { onPick: (q: string) => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 text-center">
      <div>
        <p className="text-lg text-white/90">
          Ask anything about Circuit Labs&apos; finances
        </p>
        <p className="text-sm text-muted">
          I answer only from the real data - across Chase, BoA and Amex.
        </p>
      </div>
      <div className="flex max-w-xl flex-wrap justify-center gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onPick(s)}
            className="rounded-full border border-line bg-surface/60 px-3.5 py-1.5 text-xs text-white/80 transition-colors hover:border-brand/50 hover:text-white"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function Followups({
  questions,
  onPick,
}: {
  questions: string[];
  onPick: (q: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 pt-1">
      <span className="text-[11px] uppercase tracking-wide text-muted">
        Follow-ups
      </span>
      {questions.map((q) => (
        <button
          key={q}
          type="button"
          onClick={() => onPick(q)}
          className="rounded-full border border-line bg-surface/60 px-3 py-1.5 text-xs text-white/80 transition-colors hover:border-brand/50 hover:text-white"
        >
          {q}
        </button>
      ))}
    </div>
  );
}

function Bubble({ msg }: { msg: UiMessage }) {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-brand px-4 py-2.5 text-sm text-white">
          {msg.content}
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-stretch gap-3">
      {msg.trace && msg.trace.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {msg.trace.map((t, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface/50 px-2.5 py-1 text-[11px]"
            >
              <Wrench className="h-3 w-3 text-brand" />
              <span className="text-white/70">{t.name}</span>
              <span className="text-muted">{summarizeArgs(t.args)}</span>
            </span>
          ))}
        </div>
      )}

      {msg.widgets?.map((w, i) => (
        <AgentWidget key={i} w={w} />
      ))}

      {msg.content.trim() && (
        <div className="max-w-[85%] rounded-2xl rounded-bl-sm border border-line bg-surface/40 px-4 py-2.5 text-sm text-white/90">
          <Markdown text={msg.content} />
        </div>
      )}
    </div>
  );
}

function Thinking() {
  return (
    <div className="flex items-center gap-2 text-sm text-muted">
      <Loader2 className="h-4 w-4 animate-spin text-brand" />
      Thinking…
    </div>
  );
}

/** Minimal markdown: **bold**, bullet lines, and line breaks. No raw asterisks. */
function Markdown({ text }: { text: string }) {
  const lines = text.split("\n").filter((l) => l.trim() !== "");
  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => (
        <p key={i}>{inline(line.replace(/^\s*[-*]\s+/, "• "))}</p>
      ))}
    </div>
  );
}

function inline(line: string) {
  return line.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="font-semibold text-white">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

function summarizeArgs(args: unknown): string {
  if (!args || typeof args !== "object") return "";
  const obj = args as Record<string, unknown>;
  const flat: string[] = [];
  if (obj.filters && typeof obj.filters === "object") {
    for (const [k, v] of Object.entries(obj.filters as Record<string, unknown>)) {
      flat.push(`${k}:${fmtVal(v)}`);
    }
  }
  for (const k of ["groupBy", "metric", "sort", "order", "limit", "id"]) {
    if (obj[k] != null) flat.push(`${k}:${fmtVal(obj[k])}`);
  }
  return flat.length ? `· ${flat.join(", ")}` : "";
}

function fmtVal(v: unknown): string {
  return Array.isArray(v) ? `[${v.join("|")}]` : String(v);
}
