import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as userService from "./services";
import type { User } from "./interfaces";

const KEYS = {
  all: ["users"] as const,
};

export function useUsers() {
  return useQuery({
    queryKey: KEYS.all,
    queryFn: userService.getUsers,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<User> & { password?: string }) =>
      userService.createUser(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Partial<User> & { password?: string };
    }) => userService.updateUser(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => userService.deleteUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}
