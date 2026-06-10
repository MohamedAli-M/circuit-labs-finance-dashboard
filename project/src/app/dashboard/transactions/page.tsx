"use client";

import { useRequireTab } from "@/lib/useAuth";
import { TransactionsView } from "@/components/transactions/TransactionsView";

export default function TransactionsPage() {
  const user = useRequireTab("transactions");
  if (!user) return null;
  return <TransactionsView />;
}
