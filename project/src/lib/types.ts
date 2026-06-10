// Domain types. Each bank ships a different raw shape (the Raw* types below);
// normalize.ts maps all three into the single Transaction model.

export type Bank = "chase" | "boa" | "amex";
export type Currency = "USD" | "EUR" | "GBP" | "CAD";
export type TxType = "debit" | "credit";
export type Role = "admin" | "finance_lead" | "analyst" | "viewer";
export type Tab = "transactions" | "stats" | "custom";

// User as stored in user.json (includes the password).
export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  title: string;
  role: Role;
  allowedTabs: Tab[];
  department: string;
  active: boolean;
  createdAt: string;
}

// The only user shape sent to the client: password removed by construction.
export type PublicUser = Omit<User, "password">;

export type TabAccessMatrix = Record<Tab, Role[]>;

export interface UserFile {
  company: string;
  authNote: string;
  tabAccessMatrix: TabAccessMatrix;
  users: User[];
}

interface RawParty {
  name: string;
  department: string;
}

// chase.json -> transactions[]
export interface RawChaseTxn {
  transactionId: string;
  postingDate: string;
  transactionDate: string;
  description: string;
  amount: number; // signed: negative = debit
  transactionType: "DEBIT" | "CREDIT";
  categoryCode: string;
  categoryName: string;
  merchantName: string;
  initiatedBy: RawParty;
  pending: boolean;
  currency: Currency;
  originalAmount: number;
}

// boa.json -> transactionList[]
export interface RawBoaTxn {
  id: string;
  transactionDate: string;
  postedDate: string;
  payee: string;
  description: string;
  amount: number; // always positive; direction is in debitCreditMemo
  debitCreditMemo: "DEBIT" | "CREDIT";
  transactionType: string;
  spendingCategory: string;
  originator: RawParty;
  currencyCode: Currency;
  originalAmount: number;
  runningBalance: number;
  status: string;
}

// amex.json -> data.charges[]
export interface RawAmexTxn {
  chargeId: string;
  transactionDate: string;
  postDate: string;
  merchant: {
    name: string;
    category: string;
    categoryCode: string;
    city: string;
    state: string;
    country: string;
  };
  amountInCents: number; // signed cents: positive = charge, negative = payment
  amountDisplay: string;
  type: "charge" | "payment";
  status: string;
  rewardEligible: boolean;
  memo: string;
  employee: RawParty;
  billingCurrency: Currency;
  originalAmountInCents: number;
}

export type RawTransaction = RawChaseTxn | RawBoaTxn | RawAmexTxn;

export interface ChaseFile {
  status: string;
  requestId: string;
  account: Record<string, unknown>;
  transactions: RawChaseTxn[];
  pagination: Record<string, unknown>;
}

export interface BoaFile {
  responseStatus: Record<string, unknown>;
  accountSummary: Record<string, unknown>;
  transactionList: RawBoaTxn[];
}

export interface AmexFile {
  cardMember: Record<string, unknown>;
  statementPeriod: Record<string, unknown>;
  data: { charges: RawAmexTxn[] };
}

// The normalized model the whole app uses. amount is a positive magnitude in the
// original currency; direction is in `type`. USD is computed on demand.
export interface Transaction {
  id: string;
  bank: Bank;
  date: string;
  description: string;
  amount: number;
  currency: Currency;
  type: TxType;
  category: string;
  vendor: string;
  authorizedBy: PublicUser | null;
  source: RawTransaction;
}
