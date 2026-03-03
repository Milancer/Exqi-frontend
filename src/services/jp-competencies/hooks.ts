import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as svc from "./services";
import type {
  JpCompetencyType,
  JpCompetencyCluster,
  JpCompetency,
} from "./interfaces";

const KEYS = {
  types: ["jp-competency-types"] as const,
  clusters: ["jp-competency-clusters"] as const,
  items: ["jp-competency-items"] as const,
};

/* ── Types ── */
export function useJpCompetencyTypes() {
  return useQuery({ queryKey: KEYS.types, queryFn: svc.getJpCompetencyTypes });
}

export function useCreateJpCompetencyType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<JpCompetencyType>) =>
      svc.createJpCompetencyType(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.types }),
  });
}

export function useUpdateJpCompetencyType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Partial<JpCompetencyType>;
    }) => svc.updateJpCompetencyType(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.types }),
  });
}

export function useDeleteJpCompetencyType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => svc.deleteJpCompetencyType(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.types }),
  });
}

/* ── Clusters ── */
export function useJpCompetencyClusters() {
  return useQuery({
    queryKey: KEYS.clusters,
    queryFn: svc.getJpCompetencyClusters,
  });
}

export function useCreateJpCompetencyCluster() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<JpCompetencyCluster>) =>
      svc.createJpCompetencyCluster(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.clusters }),
  });
}

export function useUpdateJpCompetencyCluster() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Partial<JpCompetencyCluster>;
    }) => svc.updateJpCompetencyCluster(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.clusters }),
  });
}

export function useDeleteJpCompetencyCluster() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => svc.deleteJpCompetencyCluster(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.clusters }),
  });
}

/* ── Items ── */
export function useJpCompetencyItems() {
  return useQuery({ queryKey: KEYS.items, queryFn: svc.getJpCompetencyItems });
}

export function useCreateJpCompetencyItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<JpCompetency>) =>
      svc.createJpCompetencyItem(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.items }),
  });
}

export function useUpdateJpCompetencyItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<JpCompetency> }) =>
      svc.updateJpCompetencyItem(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.items }),
  });
}

export function useDeleteJpCompetencyItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => svc.deleteJpCompetencyItem(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.items }),
  });
}
