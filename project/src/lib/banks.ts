import { readFileSync } from "fs";
import { join } from "path";
import type { Bank } from "./types";

/**
 * Raw bank-file access for the passthrough routes (/api/banks/<bank>/...),
 * which must return each file "exactly as-is". Server-only.
 */
const FILES: Record<Bank, string> = {
  chase: "chase.json",
  boa: "boa.json",
  amex: "amex.json",
};

export function getRawBankFile(bank: Bank): unknown {
  const path = join(process.cwd(), "data", "transactions", FILES[bank]);
  return JSON.parse(readFileSync(path, "utf-8"));
}
