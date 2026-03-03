import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as svc from "./services";

const KEYS = {
  all: ["interviews"] as const,
  detail: (id: number) => ["interviews", id] as const,
  responses: (id: number) => ["interviews", id, "responses"] as const,
};

export function useInterviews() {
  return useQuery({ queryKey: KEYS.all, queryFn: svc.getInterviews });
}

export function useInterview(id: number) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => svc.getInterview(id),
    enabled: !!id,
  });
}

export function useInterviewResponses(sessionId: number) {
  return useQuery({
    queryKey: KEYS.responses(sessionId),
    queryFn: () => svc.getInterviewResponses(sessionId),
    enabled: !!sessionId,
  });
}

export function useCreateInterview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      candidate_id: number;
      cbi_template_id: number;
      interviewer_id: number;
    }) => svc.createInterview(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}

export function useCancelInterview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => svc.cancelInterview(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}

export function useSaveScores() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      sessionId,
      scores,
    }: {
      sessionId: number;
      scores: { response_id: number; rating: number }[];
    }) => svc.saveScores(sessionId, scores),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: KEYS.detail(variables.sessionId) });
      qc.invalidateQueries({ queryKey: KEYS.responses(variables.sessionId) });
    },
  });
}
