"use client";

import { useRequireTab } from "@/lib/useAuth";
import { StatsView } from "@/components/stats/StatsView";

export default function StatsPage() {
  const user = useRequireTab("stats");
  if (!user) return null;
  return <StatsView />;
}
