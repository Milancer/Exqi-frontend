import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as candidateService from "./services";
import type { Candidate } from "./interfaces";

const KEYS = {
  all: ["candidates"] as const,
};

export function useCandidates() {
  return useQuery({
    queryKey: KEYS.all,
    queryFn: candidateService.getCandidates,
  });
}

export function useCreateCandidate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Candidate>) =>
      candidateService.createCandidate(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}

export function useUpdateCandidate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Candidate> }) =>
      candidateService.updateCandidate(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}

export function useDeleteCandidate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => candidateService.deleteCandidate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}
