import { useQuery } from "@tanstack/react-query";
import * as svc from "./services";

const KEYS = {
  stats: ["dashboard-stats"] as const,
};

export function useDashboardStats() {
  return useQuery({
    queryKey: KEYS.stats,
    queryFn: svc.getDashboardStats,
    staleTime: 60_000, // Dashboard data can be slightly stale
  });
}
