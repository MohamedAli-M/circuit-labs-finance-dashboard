# Circuit Labs Finance Dashboard

The goal I understood from the assignment: the project unifies transactions from three banks (Chase, Bank of America, Amex), each with a very different data shape and four currencies, into one dashboard: role-based tabs, analytics, and an additional bonus tab, an AI assistant that answers from the live data.

Stack as requested: Next.js 16 (App Router), React 19, TypeScript, Tailwind, SWR, OpenAI.

**Live demo:** https://circuit-labs-finance-dashboard.vercel.app/

Log in with any account below. The AI assistant works on the live demo with no setup needed.

## Run

```bash
cd project
npm install          # use --legacy-peer-deps if npm complains about peer deps
npm run dev          # http://localhost:3000
```

### Logins (`data/users/user.json`)

| Role | Email | Password | Tabs |
|---|---|---|---|
| admin | alex.rivera@circuitlabs.io | `CircuitAdmin2025!` | all |
| finance_lead | priya.shah@circuitlabs.io | `CircuitFinance2025!` | all |
| analyst | marcus.chen@circuitlabs.io | `CircuitAnalyst2025!` | Stats |
| viewer | jordan.lee@circuitlabs.io | `CircuitViewer2025!` | Transactions |

### AI assistant

It already works on the live demo (the key is set server-side). To run it locally, copy `.env.example` to `.env.local` and set `OPENAI_API_KEY`; without a key the Assistant tab just shows a setup message and the rest of the app still works.

## How it's organized

```
data/*.json  ->  lib/normalize.ts  ->  Transaction[]  ->  /api routes  ->  React tabs
```

The three banks send three different shapes, so the main idea is to turn all of them into one `Transaction` model in a single place, and have everything else only ever use that one model.

- **`lib/types.ts`** the one model, plus the raw shape of each bank. `PublicUser = Omit<User, "password">` means a password can't be sent to the browser by accident.
- **`lib/normalize.ts`** one small adapter per bank, each handling that bank's quirks: Chase signs the amount, BoA keeps the in/out direction in a separate field, Amex uses cents and "charge/payment". It also matches the person's name to a user and tidies up vendor name casing.
- **`lib/currency.ts`** all the currency conversion in one file. The rates are the USD value of one unit, so converting to USD means multiplying.
- **`lib/auth.ts` / `rbac.ts`** the localStorage session and the tab-access rules.
- **API routes** kept thin: read the filters from the URL, return JSON.
- **`lib/agent/*`** the assistant: a flexible query tool, account info, the tool loop, and the widgets it draws.

## Decisions and tradeoffs

- `amount` is always a positive number; whether it's money in or out lives in `type`. The USD value is worked out when needed rather than stored.
- The `amount` filter compares in USD, because the brief's filter doesn't name a currency and the rows are in different ones.
- Vendor names are normalized to one casing in the engine, otherwise grouping splits "Sequoia Capital" and "SEQUOIA CAPITAL" into two different vendors.
- Categories are left exactly as each bank sends them (the banks don't agree on a naming scheme); the assistant combines the related ones when you ask.
- Auth and RBAC run on the client (localStorage plus a route guard), the way the brief describes. It decides what the UI shows; it isn't real server-side security.
- No database. The JSON files are read directly, behind one function, so switching to a real database later would be a small change.
- The table shows 12 rows per page with arrows (the brief caps it at 30). CSV export includes everything that matches the current filters.

## The AI assistant

It has three tools it can combine: `query_transactions` (filter, group, total, in USD or counts), `get_accounts`, and `get_transaction`. Every number it gives comes from one of those tools, so it can't make figures up. Depending on the question it draws the answer as a ranking, stat cards, a bar chart, or a table. It runs on gpt-5.4-mini at medium reasoning effort (both can be changed with env vars).

## Not done

- The "starred transactions" view from the Figma (it wasn't asked for).
- Real `.xlsx` export; I used CSV instead.
- Server-side auth and tests.

## AI tools used

I used Claude (Claude Code) for a lot of this: digging through the three datasets to find the inconsistencies, building the normalization / currency / RBAC / API layer, building the UI, and building the assistant. I made the architecture and product calls, double-checked the numbers, and read through the code.
