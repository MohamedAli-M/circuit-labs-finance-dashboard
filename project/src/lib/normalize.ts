import { readFileSync } from "fs";
import { join } from "path";
import type {
  Transaction,
  PublicUser,
  UserFile,
  ChaseFile,
  BoaFile,
  AmexFile,
  RawChaseTxn,
  RawBoaTxn,
  RawAmexTxn,
} from "./types";

// Conformance layer: three bank shapes -> one Transaction model. Server-only
// (reads the JSON files); the browser fetches /api/transactions instead.

const DATA_DIR = join(process.cwd(), "data");

function readJson<T>(...segments: string[]): T {
  return JSON.parse(readFileSync(join(DATA_DIR, ...segments), "utf-8")) as T;
}

const key = (name: string): string => name.trim().toLowerCase();

// name -> user (password stripped), used to resolve authorizedBy.
function buildUserIndex(): Map<string, PublicUser> {
  const file = readJson<UserFile>("users", "user.json");
  const index = new Map<string, PublicUser>();
  for (const user of file.users) {
    const { password: _password, ...pub } = user;
    index.set(key(user.name), pub);
  }
  return index;
}

function fromChase(raw: RawChaseTxn, users: Map<string, PublicUser>): Transaction {
  return {
    id: `chase:${raw.transactionId}`,
    bank: "chase",
    date: raw.transactionDate,
    description: raw.description,
    amount: Math.abs(raw.amount), // signed -> magnitude
    currency: raw.currency,
    type: raw.transactionType === "CREDIT" ? "credit" : "debit",
    category: raw.categoryName,
    vendor: raw.merchantName,
    authorizedBy: users.get(key(raw.initiatedBy.name)) ?? null,
    source: raw,
  };
}

function fromBoa(raw: RawBoaTxn, users: Map<string, PublicUser>): Transaction {
  return {
    id: `boa:${raw.id}`,
    bank: "boa",
    date: raw.transactionDate,
    description: raw.description,
    amount: raw.amount, // already positive; direction from the memo
    currency: raw.currencyCode,
    type: raw.debitCreditMemo === "CREDIT" ? "credit" : "debit",
    category: raw.spendingCategory,
    vendor: raw.payee,
    authorizedBy: users.get(key(raw.originator.name)) ?? null,
    source: raw,
  };
}

function fromAmex(raw: RawAmexTxn, users: Map<string, PublicUser>): Transaction {
  return {
    id: `amex:${raw.chargeId}`,
    bank: "amex",
    date: raw.transactionDate,
    description: raw.memo,
    amount: Math.abs(raw.amountInCents) / 100, // signed cents -> dollar magnitude
    currency: raw.billingCurrency,
    type: raw.type === "payment" ? "credit" : "debit", // charge = out, payment = in
    category: raw.merchant.category,
    vendor: raw.merchant.name,
    authorizedBy: users.get(key(raw.employee.name)) ?? null,
    source: raw,
  };
}

// Memoized: the data is static, so build the list once.
let cache: Transaction[] | null = null;

export function getAllTransactions(): Transaction[] {
  if (cache) return cache;

  const users = buildUserIndex();
  const merged: Transaction[] = [
    ...readJson<ChaseFile>("transactions", "chase.json").transactions.map((t) => fromChase(t, users)),
    ...readJson<BoaFile>("transactions", "boa.json").transactionList.map((t) => fromBoa(t, users)),
    ...readJson<AmexFile>("transactions", "amex.json").data.charges.map((t) => fromAmex(t, users)),
  ];

  // Same vendor is cased differently per bank ("Sequoia Capital" vs "SEQUOIA
  // CAPITAL"); keep the nicest-cased variant so grouping doesn't split it.
  const lowerCount = (s: string) => (s.match(/[a-z]/g) ?? []).length;
  const label = new Map<string, string>();
  for (const t of merged) {
    const k = t.vendor.trim().toUpperCase();
    const best = label.get(k);
    if (!best || lowerCount(t.vendor) > lowerCount(best)) label.set(k, t.vendor.trim());
  }
  for (const t of merged) t.vendor = label.get(t.vendor.trim().toUpperCase()) ?? t.vendor;

  // Strip em dashes from the display description only; raw source stays untouched
  // so the passthrough routes still match the files byte-for-byte.
  const DASH = String.fromCharCode(0x2014);
  for (const t of merged) {
    if (t.description.includes(DASH)) t.description = t.description.split(DASH).join("-");
  }

  cache = merged.sort((a, b) => a.date.localeCompare(b.date)); // earliest first
  return cache;
}

export function getTransactionById(id: string): Transaction | undefined {
  return getAllTransactions().find((t) => t.id === id);
}
