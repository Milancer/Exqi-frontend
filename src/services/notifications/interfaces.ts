export interface NotificationItem {
  notification_id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  reference_type: string | null;
  reference_id: number | null;
  client_id: number;
  created_at: string;
}
