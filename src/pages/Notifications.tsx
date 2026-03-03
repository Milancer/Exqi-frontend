import { useNavigate } from "react-router-dom";
import {
  Title,
  Button,
  Stack,
  Paper,
  Text,
  Box,
  Group,
  ActionIcon,
  Tooltip,
  ThemeIcon,
  Loader,
  Center,
} from "@mantine/core";
import {
  IconBell,
  IconCheck,
  IconChecks,
  IconClipboardList,
  IconBriefcase,
  IconUserStar,
} from "@tabler/icons-react";
import type { NotificationItem } from "../services/notifications/interfaces";
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
} from "../services/notifications/hooks";

export default function Notifications() {
  const { data: notificationsList = [], isLoading: loading } =
    useNotifications();
  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();
  const navigate = useNavigate();

  const markAsRead = async (id: number) => {
    try {
      await markAsReadMutation.mutateAsync(id);
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  const markAllRead = async () => {
    try {
      await markAllAsReadMutation.mutateAsync();
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  const handleClick = async (n: NotificationItem) => {
    if (!n.is_read) await markAsRead(n.notification_id);
    // Navigate to referenced entity
    if (n.reference_type === "interview_session") {
      navigate("/interviews");
    } else if (n.reference_type === "job_profile") {
      navigate("/job-profiles");
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "InterviewAssigned":
        return <IconUserStar size={18} />;
      case "InterviewCompleted":
        return <IconClipboardList size={18} />;
      case "JobProfileApproval":
        return <IconBriefcase size={18} />;
      default:
        return <IconBell size={18} />;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case "InterviewAssigned":
        return "blue";
      case "InterviewCompleted":
        return "green";
      case "JobProfileApproval":
        return "orange";
      default:
        return "gray";
    }
  };

  const unreadCount = notificationsList.filter((n) => !n.is_read).length;

  // Group by date
  const grouped: Record<string, NotificationItem[]> = {};
  notificationsList.forEach((n) => {
    const date = new Date(n.created_at).toLocaleDateString("en-ZA", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(n);
  });

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-end">
        <Box>
          <Title order={2} fw={800}>
            Notifications
          </Title>
          <Text size="sm" c="dimmed">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
              : "All caught up"}
          </Text>
        </Box>
        {unreadCount > 0 && (
          <Button
            leftSection={<IconChecks size={16} />}
            onClick={markAllRead}
            variant="light"
            size="sm"
          >
            Mark all read
          </Button>
        )}
      </Group>

      {loading ? (
        <Center p="xl">
          <Loader />
        </Center>
      ) : notificationsList.length === 0 ? (
        <Paper withBorder p="xl">
          <Stack align="center" py={40} gap="md">
            <ThemeIcon color="gray" size={48} radius="xl" variant="light">
              <IconBell size={24} />
            </ThemeIcon>
            <Text c="dimmed" size="lg">
              No notifications yet
            </Text>
          </Stack>
        </Paper>
      ) : (
        Object.entries(grouped).map(([date, items]) => (
          <Box key={date}>
            <Text size="xs" fw={600} tt="uppercase" c="dimmed" mb="xs">
              {date}
            </Text>
            <Stack gap="xs">
              {items.map((n) => (
                <Paper
                  key={n.notification_id}
                  withBorder
                  p="sm"
                  style={{
                    cursor: "pointer",
                    background: n.is_read
                      ? undefined
                      : "var(--mantine-color-blue-light)",
                    borderLeft: n.is_read
                      ? undefined
                      : `3px solid var(--mantine-color-blue-6)`,
                  }}
                  onClick={() => handleClick(n)}
                >
                  <Group gap="sm" wrap="nowrap">
                    <ThemeIcon
                      variant="light"
                      color={getColor(n.type)}
                      size="md"
                      radius="xl"
                    >
                      {getIcon(n.type)}
                    </ThemeIcon>
                    <Box style={{ flex: 1 }}>
                      <Group justify="space-between" gap="xs">
                        <Text size="sm" fw={n.is_read ? 400 : 600}>
                          {n.title}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {new Date(n.created_at).toLocaleTimeString("en-ZA", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Text>
                      </Group>
                      <Text size="xs" c="dimmed" lineClamp={2}>
                        {n.message}
                      </Text>
                    </Box>
                    {!n.is_read && (
                      <Tooltip label="Mark as read">
                        <ActionIcon
                          variant="subtle"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(n.notification_id);
                          }}
                        >
                          <IconCheck size={14} />
                        </ActionIcon>
                      </Tooltip>
                    )}
                  </Group>
                </Paper>
              ))}
            </Stack>
          </Box>
        ))
      )}
    </Stack>
  );
}
