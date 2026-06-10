"use client";

import { useRequireTab } from "@/lib/useAuth";
import { AskCircuit } from "@/components/agent/AskCircuit";

export default function CustomPage() {
  const user = useRequireTab("custom");
  if (!user) return null;
  return <AskCircuit />;
}
