import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import * as svc from "./services";
import type {
  CompetencyType,
  CompetencyCluster,
  Competency,
  CompetencyQuestion,
} from "./interfaces";

const KEYS = {
  types: ["competency-types"] as const,
  clusters: ["competency-clusters"] as const,
  competencies: ["competencies"] as const,
  questions: ["competency-questions"] as const,
};

/* ── Types ── */
export function useCompetencyTypes() {
  return useQuery({ queryKey: KEYS.types, queryFn: svc.getCompetencyTypes });
}

export function useCreateCompetencyType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CompetencyType>) =>
      svc.createCompetencyType(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.types }),
  });
}

export function useUpdateCompetencyType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CompetencyType> }) =>
      svc.updateCompetencyType(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.types }),
  });
}

export function useDeleteCompetencyType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => svc.deleteCompetencyType(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.types }),
  });
}

/* ── Clusters ── */
export function useCompetencyClusters() {
  return useQuery({
    queryKey: KEYS.clusters,
    queryFn: svc.getCompetencyClusters,
  });
}

export function useCreateCompetencyCluster() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CompetencyCluster>) =>
      svc.createCompetencyCluster(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.clusters }),
  });
}

export function useUpdateCompetencyCluster() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Partial<CompetencyCluster>;
    }) => svc.updateCompetencyCluster(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.clusters }),
  });
}

export function useDeleteCompetencyCluster() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => svc.deleteCompetencyCluster(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.clusters }),
  });
}

/* ── Competencies ── */
export function useCompetencies() {
  return useQuery({
    queryKey: KEYS.competencies,
    queryFn: svc.getCompetencies,
  });
}

export function useCreateCompetency() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Competency>) => svc.createCompetency(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.competencies }),
  });
}

export function useUpdateCompetency() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Competency> }) =>
      svc.updateCompetency(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.competencies }),
  });
}

export function useDeleteCompetency() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => svc.deleteCompetency(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.competencies }),
  });
}

/* ── Questions ── */
export function useCompetencyQuestions(params?: {
  page?: number;
  limit?: number;
  competencyId?: number;
  level?: number;
  status?: string;
}) {
  return useQuery({
    queryKey: [...KEYS.questions, params],
    queryFn: () => svc.getQuestions(params),
    placeholderData: keepPreviousData,
  });
}

/** Fetch all questions (unpaginated) — for CBI template building */
export function useAllCompetencyQuestions() {
  return useQuery({
    queryKey: [...KEYS.questions, "all"],
    queryFn: svc.getAllQuestions,
  });
}

export function useCreateQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CompetencyQuestion>) => svc.createQuestion(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.questions }),
  });
}

export function useUpdateQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Partial<CompetencyQuestion>;
    }) => svc.updateQuestion(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.questions }),
  });
}

export function useDeleteQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => svc.deleteQuestion(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.questions }),
  });
}
