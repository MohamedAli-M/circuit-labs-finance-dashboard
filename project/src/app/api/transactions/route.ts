import { NextRequest, NextResponse } from "next/server";
import { queryTransactions } from "@/lib/transactions";

// Normalized, merged, filtered, earliest-first list of all transactions.
export const dynamic = "force-dynamic";

export function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const txns = queryTransactions({
    bank: sp.get("bank") ?? undefined,
    authorizedBy: sp.get("authorizedBy") ?? undefined,
    amount: sp.get("amount") ?? undefined,
    fromDate: sp.get("fromDate") ?? undefined,
  });
  return NextResponse.json(txns);
}
