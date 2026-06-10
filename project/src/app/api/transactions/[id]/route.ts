import { NextResponse } from "next/server";
import { getTransactionById } from "@/lib/normalize";

// A single normalized transaction by id, including its raw source (in `source`).
// Next 16: route `params` is async and must be awaited.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const txn = getTransactionById(id);
  if (!txn) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }
  return NextResponse.json(txn);
}
