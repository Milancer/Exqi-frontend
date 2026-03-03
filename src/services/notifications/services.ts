import api from "../api";
import type { NotificationItem } from "./interfaces";

export async function getNotifications(): Promise<NotificationItem[]> {
  const res = await api.get("/notifications");
  return res.data;
}

export async function markAsRead(id: number): Promise<void> {
  await api.patch(`/notifications/${id}/read`);
}

export async function markAllAsRead(): Promise<void> {
  await api.patch("/notifications/read-all");
}

export async function getUnreadCount(): Promise<number> {
  const res = await api.get("/notifications/unread-count");
  return res.data?.count ?? 0;
}
