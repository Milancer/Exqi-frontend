import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as notificationService from "./services";

const KEYS = {
  all: ["notifications"] as const,
  unreadCount: ["notifications", "unread-count"] as const,
};

export function useNotifications() {
  return useQuery({
    queryKey: KEYS.all,
    queryFn: notificationService.getNotifications,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: KEYS.unreadCount,
    queryFn: notificationService.getUnreadCount,
  });
}

export function useMarkAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => notificationService.markAsRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: KEYS.unreadCount });
    },
  });
}

export function useMarkAllAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: KEYS.unreadCount });
    },
  });
}
