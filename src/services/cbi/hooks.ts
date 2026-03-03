import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as svc from "./services";
import type { CbiTemplate } from "./interfaces";

const KEYS = {
  all: ["cbi-templates"] as const,
};

export function useCbiTemplates() {
  return useQuery({ queryKey: KEYS.all, queryFn: svc.getTemplates });
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CbiTemplate>) => svc.createTemplate(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}

export function useUpdateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CbiTemplate> }) =>
      svc.updateTemplate(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => svc.deleteTemplate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}
