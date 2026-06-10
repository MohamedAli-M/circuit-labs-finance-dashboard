import { getRawBankFile } from "@/lib/banks";
import type { ChaseFile, BoaFile, AmexFile } from "@/lib/types";

// Account-level metadata (balances, statements, card details) for get_accounts.
export function getAccounts() {
  const chase = getRawBankFile("chase") as ChaseFile;
  const boa = getRawBankFile("boa") as BoaFile;
  const amex = getRawBankFile("amex") as AmexFile;

  return {
    chase: { provider: "Chase", ...chase.account },
    boa: { provider: "Bank of America", ...boa.accountSummary },
    amex: {
      provider: "American Express",
      card: amex.cardMember,
      statement: amex.statementPeriod,
    },
  };
}
