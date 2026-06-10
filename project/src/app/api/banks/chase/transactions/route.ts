import { NextResponse } from "next/server";
import { getRawBankFile } from "@/lib/banks";

// Returns the raw Chase JSON exactly as-is.
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(getRawBankFile("chase"));
}
