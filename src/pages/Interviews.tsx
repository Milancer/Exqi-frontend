import { useState, useEffect, useMemo } from "react";
import { notifications } from "@mantine/notifications";
import {
  Title,
  Button,
  Table,
  Modal,
  Select,
  Group,
  ActionIcon,
  Badge,
  Stack,
  Paper,
  Text,
  Box,
  Tooltip,
  Loader,
  Center,
  TextInput,
  Progress,
  CopyButton,
  ThemeIcon,
  RingProgress,
} from "@mantine/core";
import {
  IconPlus,
  IconTrash,
  IconEye,
  IconClipboardList,
  IconCopy,
  IconCheck,
  IconAlertTriangle,
  IconClock,
} from "@tabler/icons-react";
import { useForm } from "@mantine/form";
import api from "../services/api";
import { useUrlFilters } from "../hooks/useUrlFilters";

import type {
  InterviewSession,
  InterviewResponseItem,
} from "../services/interviews/interfaces";

export default function Interviews() {
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpened, setModalOpened] = useState(false);
  const [detailSession, setDetailSession] = useState<InterviewSession | null>(
    null,
  );
  const [responses, setResponses] = useState<InterviewResponseItem[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isScoring, setIsScoring] = useState(false);
  const [savingScores, setSavingScores] = useState(false);

  // Support data for create form
  const [candidates, setCandidates] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  const f = useUrlFilters(["search", "ivStatus"] as const);

  const form = useForm({
    initialValues: {
      candidate_id: "",
      cbi_template_id: "",
      interviewer_id: "",
    },
  });

  const fetchSessions = async () => {
    try {
      const res = await api.get("/interviews");
      setSessions(res.data);
    } catch (err: any) {
      notifications.show({
        title: "Error",
        message: err.response?.data?.message || "Failed to fetch interviews",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSupportData = async () => {
    try {
      const [cRes, tRes, uRes] = await Promise.all([
        api.get("/candidates"),
        api.get("/cbi/templates"),
        api.get("/users"),
      ]);
      setCandidates(cRes.data);
      setTemplates(tRes.data);
      setUsers(
        uRes.data.filter(
          (u: any) => u.role === "OFFICE_MANAGER" || u.role === "ADMIN",
        ),
      );
    } catch (err: any) {
      notifications.show({
        title: "Error",
        message: err.response?.data?.message || "Failed to fetch support data",
        color: "red",
      });
    }
  };

  useEffect(() => {
    fetchSessions();
    fetchSupportData();
  }, []);

  const filtered = useMemo(() => {
    const search = f.get("search")?.toLowerCase();
    const status = f.get("ivStatus");
    return sessions.filter((s) => {
      if (
        search &&
        !`${s.candidate?.name} ${s.candidate?.surname}`
          .toLowerCase()
          .includes(search) &&
        !(s.template?.template_name || "").toLowerCase().includes(search)
      )
        return false;
      if (status && s.status !== status) return false;
      return true;
    });
  }, [sessions, f]);

  const handleCreate = async (values: typeof form.values) => {
    try {
      await api.post("/interviews", {
        candidate_id: +values.candidate_id,
        cbi_template_id: +values.cbi_template_id,
        interviewer_id: +values.interviewer_id,
      });
      setModalOpened(false);
      form.reset();
      fetchSessions();
    } catch (err: any) {
      notifications.show({
        title: "Error",
        message: err.response?.data?.message || "Failed to create interview",
        color: "red",
      });
    }
  };

  const handleCancel = async (id: number) => {
    if (!confirm("Cancel this interview session?")) return;
    try {
      await api.delete(`/interviews/${id}`);
      fetchSessions();
    } catch (err: any) {
      notifications.show({
        title: "Error",
        message: err.response?.data?.message || "Failed to cancel interview",
        color: "red",
      });
    }
  };

  const viewDetail = async (session: InterviewSession) => {
    setDetailSession(session);
    if (session.status === "Completed") {
      setDetailLoading(true);
      try {
        const res = await api.get(
          `/interviews/${session.session_id}/responses`,
        );
        setResponses(res.data);
      } catch (err: any) {
        notifications.show({
          title: "Error",
          message: err.response?.data?.message || "Failed to fetch responses",
          color: "red",
        });
      } finally {
        setDetailLoading(false);
      }
    }
  };

  const handleSaveScores = async () => {
    if (!detailSession) return;
    setSavingScores(true);
    try {
      const scores = responses.map((r) => ({
        response_id: r.response_id,
        rating: r.rating || 0,
      }));

      await api.patch(`/interviews/${detailSession.session_id}/score`, {
        scores,
      });

      // Refresh details to get updated score
      const res = await api.get(`/interviews/${detailSession.session_id}`);
      setDetailSession(res.data);
      setIsScoring(false);
      fetchSessions(); // Update list view too
    } catch (err: any) {
      notifications.show({
        title: "Error",
        message: err.response?.data?.message || "Failed to save scores",
        color: "red",
      });
    } finally {
      setSavingScores(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "yellow";
      case "InProgress":
        return "blue";
      case "Completed":
        return "green";
      case "Expired":
        return "red";
      default:
        return "gray";
    }
  };

  const getInterviewLink = (token: string) =>
    `${window.location.origin}/interview/${token}`;

  // Detail view
  if (detailSession) {
    const s = detailSession;
    return (
      <Stack gap="lg">
        <Group>
          <Button variant="subtle" onClick={() => setDetailSession(null)}>
            ← Back to Interviews
          </Button>
        </Group>
        <Group justify="space-between" align="flex-start">
          <Box>
            <Title order={2} fw={800}>
              {s.candidate?.name} {s.candidate?.surname}
            </Title>
            <Text c="dimmed">
              {s.template?.template_name} • Interviewer: {s.interviewer?.name}{" "}
              {s.interviewer?.surname}
            </Text>
          </Box>
          <Badge size="lg" color={getStatusColor(s.status)}>
            {s.status}
          </Badge>
        </Group>

        <Paper withBorder p="md">
          <Group gap="xl" wrap="wrap">
            <Box>
              <Text size="xs" c="dimmed">
                Created
              </Text>
              <Text fw={500}>{new Date(s.created_at).toLocaleString()}</Text>
            </Box>
            <Box>
              <Text size="xs" c="dimmed">
                Expires
              </Text>
              <Text fw={500}>{new Date(s.expires_at).toLocaleString()}</Text>
            </Box>
            {s.completed_at && (
              <Box>
                <Text size="xs" c="dimmed">
                  Completed
                </Text>
                <Text fw={500}>
                  {new Date(s.completed_at).toLocaleString()}
                </Text>
              </Box>
            )}
            {s.percentage !== null && (
              <Box>
                <Text size="xs" c="dimmed">
                  Score
                </Text>
                <Group gap="xs">
                  <RingProgress
                    size={42}
                    thickness={5}
                    roundCaps
                    sections={[
                      {
                        value: s.percentage,
                        color:
                          s.percentage >= 70
                            ? "green"
                            : s.percentage >= 40
                              ? "yellow"
                              : "red",
                      },
                    ]}
                  />
                  <Text fw={700} size="lg">
                    {s.percentage}%
                  </Text>
                  <Text c="dimmed" size="sm">
                    ({s.total_score}/{s.max_possible_score})
                  </Text>
                </Group>
              </Box>
            )}
          </Group>
        </Paper>

        {s.status === "Completed" && (
          <Paper withBorder p="md">
            <Title order={4} mb="md">
              Responses
            </Title>
            {detailLoading ? (
              <Center p="xl">
                <Loader />
              </Center>
            ) : responses.length === 0 ? (
              <Text c="dimmed">No responses recorded</Text>
            ) : (
              <Stack gap="md">
                <Group justify="flex-end">
                  {isScoring ? (
                    <Group>
                      <Button
                        variant="default"
                        onClick={() => {
                          setIsScoring(false);
                          // Re-fetch to reset any unsaved changes
                          viewDetail(s);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSaveScores}
                        loading={savingScores}
                        color="green"
                      >
                        Save Scores
                      </Button>
                    </Group>
                  ) : (
                    <Button onClick={() => setIsScoring(true)}>
                      Score Interview
                    </Button>
                  )}
                </Group>
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>#</Table.Th>
                      <Table.Th>Question ID</Table.Th>
                      <Table.Th>Rating</Table.Th>
                      <Table.Th>Answer / Notes</Table.Th>
                      <Table.Th>Flags</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {responses.map((r, i) => {
                      const flags = r.behavioral_flags;
                      const hasFlags =
                        flags &&
                        (flags.paste_detected ||
                          (flags.focus_lost_count || 0) > 2);
                      return (
                        <Table.Tr key={r.response_id}>
                          <Table.Td>{i + 1}</Table.Td>
                          <Table.Td>{r.question_id}</Table.Td>
                          <Table.Td>
                            {isScoring ? (
                              <Select
                                value={String(r.rating || 0)}
                                onChange={(val) => {
                                  const newRating = Number(val);
                                  setResponses((prev) =>
                                    prev.map((p) =>
                                      p.response_id === r.response_id
                                        ? { ...p, rating: newRating }
                                        : p,
                                    ),
                                  );
                                }}
                                data={["1", "2", "3", "4", "5"]}
                                allowDeselect={false}
                                w={80}
                              />
                            ) : (
                              <Badge
                                color={
                                  r.rating >= 4
                                    ? "green"
                                    : r.rating >= 3
                                      ? "yellow"
                                      : "red"
                                }
                                variant="light"
                              >
                                {r.rating}/5
                              </Badge>
                            )}
                          </Table.Td>
                          <Table.Td style={{ maxWidth: 350 }}>
                            <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                              {r.notes || "—"}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            {hasFlags ? (
                              <Tooltip
                                label={`Paste: ${flags?.paste_detected ? "Yes" : "No"}, Focus lost: ${flags?.focus_lost_count || 0}x, Time: ${flags?.time_spent_seconds || "?"}s`}
                              >
                                <ThemeIcon
                                  color="orange"
                                  variant="light"
                                  size="sm"
                                >
                                  <IconAlertTriangle size={14} />
                                </ThemeIcon>
                              </Tooltip>
                            ) : (
                              <ThemeIcon
                                color="green"
                                variant="light"
                                size="sm"
                              >
                                <IconCheck size={14} />
                              </ThemeIcon>
                            )}
                          </Table.Td>
                        </Table.Tr>
                      );
                    })}
                  </Table.Tbody>
                </Table>
              </Stack>
            )}
          </Paper>
        )}
      </Stack>
    );
  }

  // List view
  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-end">
        <Box>
          <Title order={2} fw={800}>
            Interviews
          </Title>
          <Text size="sm" c="dimmed">
            Manage interview sessions and review results
          </Text>
        </Box>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => setModalOpened(true)}
          variant="gradient"
          gradient={{ from: "indigo", to: "violet", deg: 135 }}
          size="sm"
        >
          Create Interview
        </Button>
      </Group>

      <Paper
        withBorder
        p="md"
        style={{ border: "1px solid var(--mantine-color-default-border)" }}
      >
        <Group gap="sm" mb="md">
          <TextInput
            placeholder="Search candidate or template…"
            value={f.get("search") || ""}
            onChange={(e) => f.set("search", e.currentTarget.value || null)}
            style={{ flex: 1, maxWidth: 260 }}
          />
          <Select
            placeholder="All Statuses"
            data={[
              { value: "Pending", label: "Pending" },
              { value: "InProgress", label: "In Progress" },
              { value: "Completed", label: "Completed" },
              { value: "Expired", label: "Expired" },
            ]}
            value={f.get("ivStatus")}
            onChange={(v) => f.set("ivStatus", v)}
            clearable
            w={160}
          />
          <Badge variant="light" color="gray" size="lg">
            {filtered.length} / {sessions.length}
          </Badge>
        </Group>

        {loading ? (
          <Center p="xl">
            <Loader />
          </Center>
        ) : filtered.length === 0 ? (
          <Stack align="center" py={60} gap="md">
            <IconClipboardList
              size={48}
              stroke={1}
              style={{ color: "var(--mantine-color-dimmed)" }}
            />
            <Text c="dimmed" size="lg">
              {sessions.length === 0
                ? "No interviews yet"
                : "No interviews match filters"}
            </Text>
          </Stack>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Candidate</Table.Th>
                <Table.Th>Template</Table.Th>
                <Table.Th>Interviewer</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Score</Table.Th>
                <Table.Th>Expires</Table.Th>
                <Table.Th w={120}>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filtered.map((s) => (
                <Table.Tr key={s.session_id}>
                  <Table.Td fw={500}>
                    {s.candidate?.name} {s.candidate?.surname}
                  </Table.Td>
                  <Table.Td>{s.template?.template_name || "—"}</Table.Td>
                  <Table.Td>
                    {s.interviewer?.name} {s.interviewer?.surname}
                  </Table.Td>
                  <Table.Td>
                    <Badge color={getStatusColor(s.status)} variant="light">
                      {s.status}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    {s.percentage !== null ? (
                      <Group gap="xs">
                        <Progress
                          value={s.percentage}
                          color={
                            s.percentage >= 70
                              ? "green"
                              : s.percentage >= 40
                                ? "yellow"
                                : "red"
                          }
                          size="sm"
                          style={{ width: 60 }}
                        />
                        <Text size="sm" fw={500}>
                          {s.percentage}%
                        </Text>
                      </Group>
                    ) : (
                      <Text c="dimmed" size="sm">
                        —
                      </Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4}>
                      <IconClock
                        size={14}
                        style={{ color: "var(--mantine-color-dimmed)" }}
                      />
                      <Text size="sm">
                        {new Date(s.expires_at).toLocaleDateString()}
                      </Text>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4}>
                      <Tooltip label="View details">
                        <ActionIcon
                          variant="subtle"
                          onClick={() => viewDetail(s)}
                        >
                          <IconEye size={16} />
                        </ActionIcon>
                      </Tooltip>
                      {(s.status === "Pending" ||
                        s.status === "InProgress") && (
                        <CopyButton value={getInterviewLink(s.token)}>
                          {({ copied, copy }) => (
                            <Tooltip
                              label={copied ? "Copied!" : "Copy interview link"}
                            >
                              <ActionIcon
                                variant="subtle"
                                color={copied ? "teal" : "blue"}
                                onClick={copy}
                              >
                                {copied ? (
                                  <IconCheck size={16} />
                                ) : (
                                  <IconCopy size={16} />
                                )}
                              </ActionIcon>
                            </Tooltip>
                          )}
                        </CopyButton>
                      )}
                      {s.status !== "Completed" && (
                        <Tooltip label="Cancel">
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            onClick={() => handleCancel(s.session_id)}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Tooltip>
                      )}
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Paper>

      {/* Create Interview Modal */}
      <Modal
        opened={modalOpened}
        onClose={() => {
          setModalOpened(false);
          form.reset();
        }}
        title="Create Interview Session"
        size="md"
      >
        <form onSubmit={form.onSubmit(handleCreate)}>
          <Stack gap="sm">
            <Select
              label="Candidate"
              placeholder="Select candidate"
              data={candidates.map((c) => ({
                value: String(c.candidate_id),
                label: `${c.name} ${c.surname} — ${c.position}`,
              }))}
              required
              searchable
              {...form.getInputProps("candidate_id")}
            />
            <Select
              label="CBI Template"
              placeholder="Select template"
              data={templates.map((t: any) => ({
                value: String(t.cbi_template_id),
                label: t.template_name,
              }))}
              required
              searchable
              {...form.getInputProps("cbi_template_id")}
            />
            <Select
              label="Interviewer (Office Manager)"
              placeholder="Select interviewer"
              data={users.map((u: any) => ({
                value: String(u.id),
                label: `${u.name} ${u.surname} (${u.role})`,
              }))}
              required
              searchable
              {...form.getInputProps("interviewer_id")}
            />
            <Button type="submit" fullWidth mt="sm">
              Create & Generate Link
            </Button>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}
