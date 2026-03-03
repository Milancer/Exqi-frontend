import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as clientService from "./services";
import type { Client } from "./interfaces";

const KEYS = {
  all: ["clients"] as const,
};

export function useClients() {
  return useQuery({
    queryKey: KEYS.all,
    queryFn: clientService.getClients,
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Client>) => clientService.createClient(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Client> }) =>
      clientService.updateClient(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => clientService.deleteClient(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}
