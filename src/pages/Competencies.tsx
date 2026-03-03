import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Title,
  Button,
  Table,
  Modal,
  TextInput,
  Textarea,
  Select,
  NumberInput,
  Group,
  ActionIcon,
  Badge,
  Stack,
  Paper,
  Text,
  Box,
  Tooltip,
  Tabs,
  Loader,
  Switch,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconBrain,
  IconCategory,
  IconSitemap,
  IconListDetails,
  IconQuestionMark,
  IconChevronRight,
  IconWorld,
  IconHome,
} from "@tabler/icons-react";
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { useUrlFilters } from "../hooks/useUrlFilters";
import type {
  CompetencyType,
  CompetencyCluster,
  Competency,
  CompetencyQuestion,
} from "../services/competencies/interfaces";
import {
  useCompetencyTypes,
  useCompetencyClusters,
  useCompetencies as useCompetenciesQuery,
  useCompetencyQuestions,
} from "../services/competencies/hooks";

/* ──────────────────────── Empty state helper ─────────────────────── */

function EmptyState({
  icon: Icon,
  label,
  onAction,
}: {
  icon: React.ElementType;
  label: string;
  onAction: () => void;
}) {
  return (
    <Stack align="center" py={60} gap="md">
      <Icon
        size={48}
        stroke={1}
        style={{ color: "var(--mantine-color-dimmed)" }}
      />
      <Text c="dimmed" size="lg">
        {label}
      </Text>
      <Button variant="light" onClick={onAction}>
        Create one now
      </Button>
    </Stack>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   TYPES TAB
   ═══════════════════════════════════════════════════════════════════ */

function TypesTab({
  types,
  loading,
  onRefresh,
}: {
  types: CompetencyType[];
  loading: boolean;
  onRefresh: () => void;
}) {
  const { user } = useAuth();
  const [modalOpened, setModalOpened] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const form = useForm({ initialValues: { competency_type: "" } });

  const openCreate = () => {
    form.reset();
    setEditingId(null);
    setModalOpened(true);
  };

  const openEdit = (t: CompetencyType) => {
    form.setValues({ competency_type: t.competency_type });
    setEditingId(t.competency_type_id);
    setModalOpened(true);
  };

  const handleSubmit = async (values: typeof form.values) => {
    try {
      if (editingId) {
        await api.patch(`/competencies/types/${editingId}`, values);
        notifications.show({
          title: "Updated",
          message: "Type updated",
          color: "green",
        });
      } else {
        await api.post("/competencies/types", values);
        notifications.show({
          title: "Created",
          message: "Type created",
          color: "green",
        });
      }
      setModalOpened(false);
      form.reset();
      setEditingId(null);
      onRefresh();
    } catch (e: any) {
      notifications.show({
        title: "Error",
        message: e.response?.data?.message || "Operation failed",
        color: "red",
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this competency type?")) return;
    try {
      await api.delete(`/competencies/types/${id}`);
      notifications.show({
        title: "Deleted",
        message: "Type removed",
        color: "green",
      });
      onRefresh();
    } catch (e: any) {
      notifications.show({
        title: "Error",
        message: e.response?.data?.message || "Delete failed",
        color: "red",
      });
    }
  };

  return (
    <>
      <Group justify="space-between" mb="md">
        <Text size="sm" c="dimmed">
          Step 1 — Start here. Define top-level categories (e.g. Technical,
          Behavioral, Leadership)
        </Text>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={openCreate}
          variant="gradient"
          gradient={{ from: "indigo", to: "violet", deg: 135 }}
          size="sm"
        >
          Add Type
        </Button>
      </Group>

      <Paper
        withBorder
        p={0}
        style={{
          overflow: "hidden",
          border: "1px solid var(--mantine-color-default-border)",
        }}
      >
        {loading ? (
          <Box p="xl" ta="center">
            <Loader size="sm" />
          </Box>
        ) : types.length === 0 ? (
          <EmptyState
            icon={IconCategory}
            label="No competency types yet"
            onAction={openCreate}
          />
        ) : (
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Type Name</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Scope</Table.Th>
                <Table.Th w={100}>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {types.map((t) => {
                const isGlobal = t.client_id === 1;
                return (
                  <Table.Tr key={t.competency_type_id}>
                    <Table.Td fw={500}>{t.competency_type}</Table.Td>
                    <Table.Td>
                      <Badge variant="light" color="green" size="sm">
                        {t.status}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        variant="light"
                        color={isGlobal ? "blue" : "green"}
                        size="sm"
                        leftSection={
                          isGlobal ? (
                            <IconWorld size={12} />
                          ) : (
                            <IconHome size={12} />
                          )
                        }
                      >
                        {isGlobal ? "Global" : "Local"}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      {isGlobal && user?.role !== "admin" ? (
                        <Text size="xs" c="dimmed">
                          Read-only
                        </Text>
                      ) : (
                        <Group gap={4} wrap="nowrap">
                          <Tooltip label="Edit">
                            <ActionIcon
                              variant="subtle"
                              color="blue"
                              onClick={() => openEdit(t)}
                            >
                              <IconEdit size={16} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Delete">
                            <ActionIcon
                              variant="subtle"
                              color="red"
                              onClick={() => handleDelete(t.competency_type_id)}
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      )}
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        )}
      </Paper>

      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        title={editingId ? "Edit Type" : "New Competency Type"}
        size="sm"
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput
              label="Type Name"
              placeholder="e.g. Technical"
              required
              {...form.getInputProps("competency_type")}
            />
            <Button
              type="submit"
              fullWidth
              variant="gradient"
              gradient={{ from: "indigo", to: "violet", deg: 135 }}
            >
              {editingId ? "Update" : "Create"}
            </Button>
          </Stack>
        </form>
      </Modal>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   CLUSTERS TAB
   ═══════════════════════════════════════════════════════════════════ */

function ClustersTab({
  clusters,
  types,
  loading,
  onRefresh,
  filterTypeId,
  onFilterTypeChange,
}: {
  clusters: CompetencyCluster[];
  types: CompetencyType[];
  loading: boolean;
  onRefresh: () => void;
  filterTypeId: string | null;
  onFilterTypeChange: (v: string | null) => void;
}) {
  const { user } = useAuth();
  const [modalOpened, setModalOpened] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const form = useForm({
    initialValues: {
      cluster_name: "",
      description: "",
      competency_type_id: "",
    },
  });

  const typeOptions = types.map((t) => ({
    value: t.competency_type_id.toString(),
    label: t.competency_type,
  }));

  const filtered = filterTypeId
    ? clusters.filter((c) => c.competency_type_id.toString() === filterTypeId)
    : clusters;

  const openCreate = () => {
    form.reset();
    setEditingId(null);
    setModalOpened(true);
  };

  const openEdit = (c: CompetencyCluster) => {
    form.setValues({
      cluster_name: c.cluster_name,
      description: c.description || "",
      competency_type_id: c.competency_type_id.toString(),
    });
    setEditingId(c.competency_cluster_id);
    setModalOpened(true);
  };

  const handleSubmit = async (values: typeof form.values) => {
    try {
      const payload = {
        ...values,
        competency_type_id: parseInt(values.competency_type_id),
      };
      if (editingId) {
        await api.patch(`/competencies/clusters/${editingId}`, payload);
        notifications.show({
          title: "Updated",
          message: "Cluster updated",
          color: "green",
        });
      } else {
        await api.post("/competencies/clusters", payload);
        notifications.show({
          title: "Created",
          message: "Cluster created",
          color: "green",
        });
      }
      setModalOpened(false);
      form.reset();
      setEditingId(null);
      onRefresh();
    } catch (e: any) {
      notifications.show({
        title: "Error",
        message: e.response?.data?.message || "Operation failed",
        color: "red",
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this competency cluster?")) return;
    try {
      await api.delete(`/competencies/clusters/${id}`);
      notifications.show({
        title: "Deleted",
        message: "Cluster removed",
        color: "green",
      });
      onRefresh();
    } catch (e: any) {
      notifications.show({
        title: "Error",
        message: e.response?.data?.message || "Delete failed",
        color: "red",
      });
    }
  };

  return (
    <>
      <Group justify="space-between" mb="md">
        <Group gap="sm">
          <Text size="sm" c="dimmed">
            Step 2 — Group competencies under a Type. Create Types first if the
            list is empty.
          </Text>
          <Select
            placeholder="All types"
            data={typeOptions}
            value={filterTypeId}
            onChange={onFilterTypeChange}
            clearable
            size="xs"
            w={180}
          />
        </Group>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={openCreate}
          variant="gradient"
          gradient={{ from: "teal", to: "cyan", deg: 135 }}
          size="sm"
        >
          Add Cluster
        </Button>
      </Group>

      <Paper
        withBorder
        p={0}
        style={{
          overflow: "hidden",
          border: "1px solid var(--mantine-color-default-border)",
        }}
      >
        {loading ? (
          <Box p="xl" ta="center">
            <Loader size="sm" />
          </Box>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={IconSitemap}
            label="No clusters yet"
            onAction={openCreate}
          />
        ) : (
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Cluster Name</Table.Th>
                <Table.Th>Description</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Scope</Table.Th>
                <Table.Th w={100}>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filtered.map((c) => {
                const isGlobal = c.client_id === 1;
                return (
                  <Table.Tr key={c.competency_cluster_id}>
                    <Table.Td fw={500}>{c.cluster_name}</Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed" lineClamp={2}>
                        {c.description}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="light" color="indigo" size="sm">
                        {c.competencyType?.competency_type ||
                          `Type ${c.competency_type_id}`}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        variant="light"
                        color={isGlobal ? "blue" : "green"}
                        size="sm"
                        leftSection={
                          isGlobal ? (
                            <IconWorld size={12} />
                          ) : (
                            <IconHome size={12} />
                          )
                        }
                      >
                        {isGlobal ? "Global" : "Local"}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      {isGlobal && user?.role !== "admin" ? (
                        <Text size="xs" c="dimmed">
                          Read-only
                        </Text>
                      ) : (
                        <Group gap={4} wrap="nowrap">
                          <Tooltip label="Edit">
                            <ActionIcon
                              variant="subtle"
                              color="blue"
                              onClick={() => openEdit(c)}
                            >
                              <IconEdit size={16} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Delete">
                            <ActionIcon
                              variant="subtle"
                              color="red"
                              onClick={() =>
                                handleDelete(c.competency_cluster_id)
                              }
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      )}
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        )}
      </Paper>

      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        title={editingId ? "Edit Cluster" : "New Competency Cluster"}
        size="md"
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput
              label="Cluster Name"
              placeholder="e.g. Problem Solving"
              required
              {...form.getInputProps("cluster_name")}
            />
            <Textarea
              label="Description"
              placeholder="Describe this cluster"
              minRows={2}
              {...form.getInputProps("description")}
            />
            <Select
              label="Parent Type"
              placeholder="Select type"
              data={typeOptions}
              required
              {...form.getInputProps("competency_type_id")}
            />
            <Button
              type="submit"
              fullWidth
              variant="gradient"
              gradient={{ from: "teal", to: "cyan", deg: 135 }}
            >
              {editingId ? "Update" : "Create"}
            </Button>
          </Stack>
        </form>
      </Modal>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   COMPETENCIES TAB
   ═══════════════════════════════════════════════════════════════════ */

function CompetenciesTab({
  competencies,
  types,
  clusters,
  loading,
  onRefresh,
  onRefreshTypes,
  onRefreshClusters,
  onRefreshQuestions,
}: {
  competencies: Competency[];
  types: CompetencyType[];
  clusters: CompetencyCluster[];
  loading: boolean;
  onRefresh: () => void;
  onRefreshTypes: () => void;
  onRefreshClusters: () => void;
  onRefreshQuestions: () => void;
}) {
  const { user } = useAuth();
  const [modalOpened, setModalOpened] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Inner modal tab state
  const [modalTab, setModalTab] = useState("details");

  // Embedded questions state
  const [modalQuestions, setModalQuestions] = useState<CompetencyQuestion[]>(
    [],
  );
  const [loadingModalQ, setLoadingModalQ] = useState(false);
  const [qModalOpened, setQModalOpened] = useState(false);
  const [editingQId, setEditingQId] = useState<number | null>(null);
  const qForm = useForm({
    initialValues: { competency_id: "", level: 1, question: "" },
  });

  const fetchModalQuestions = useCallback(async (compId: number) => {
    setLoadingModalQ(true);
    try {
      const res = await api.get("/cbi/questions");
      setModalQuestions(
        res.data.filter((q: CompetencyQuestion) => q.competency_id === compId),
      );
    } catch {
      /* silently fail — questions are supplementary */
    } finally {
      setLoadingModalQ(false);
    }
  }, []);

  // Quick-create modals
  const [quickTypeOpened, setQuickTypeOpened] = useState(false);
  const [quickClusterOpened, setQuickClusterOpened] = useState(false);
  const quickTypeForm = useForm({ initialValues: { competency_type: "" } });
  const quickClusterForm = useForm({
    initialValues: {
      cluster_name: "",
      description: "",
      competency_type_id: "",
    },
  });

  const form = useForm({
    initialValues: {
      competency: "",
      description: "",
      indicators: "",
      competency_type_id: "",
      competency_cluster_id: "",
    },
  });

  const selectedTypeId = form.values.competency_type_id;

  const typeOptions = types.map((t) => ({
    value: t.competency_type_id.toString(),
    label: t.competency_type,
  }));

  // Cascading: filter clusters by selected type
  const clusterOptions = clusters
    .filter(
      (c) =>
        !selectedTypeId || c.competency_type_id.toString() === selectedTypeId,
    )
    .map((c) => ({
      value: c.competency_cluster_id.toString(),
      label: c.cluster_name,
    }));

  const openCreate = () => {
    form.reset();
    setEditingId(null);
    setModalOpened(true);
  };

  const openEdit = (comp: Competency) => {
    form.setValues({
      competency: comp.competency,
      description: comp.description || "",
      indicators: comp.indicators || "",
      competency_type_id: comp.competency_type_id.toString(),
      competency_cluster_id: comp.competency_cluster_id.toString(),
    });
    setEditingId(comp.competency_id);
    fetchModalQuestions(comp.competency_id);
    setModalTab("details");
    setModalOpened(true);
  };

  const handleSubmit = async (values: typeof form.values) => {
    try {
      const payload = {
        ...values,
        competency_type_id: parseInt(values.competency_type_id),
        competency_cluster_id: parseInt(values.competency_cluster_id),
      };
      if (editingId) {
        await api.patch(`/competencies/${editingId}`, payload);
        notifications.show({
          title: "Updated",
          message: "Competency updated",
          color: "green",
        });
      } else {
        await api.post("/competencies", payload);
        notifications.show({
          title: "Created",
          message: "Competency created",
          color: "green",
        });
      }
      setModalOpened(false);
      form.reset();
      setEditingId(null);
      onRefresh();
    } catch (e: any) {
      notifications.show({
        title: "Error",
        message: e.response?.data?.message || "Operation failed",
        color: "red",
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this competency?")) return;
    try {
      await api.delete(`/competencies/${id}`);
      notifications.show({
        title: "Deleted",
        message: "Competency removed",
        color: "green",
      });
      onRefresh();
    } catch (e: any) {
      notifications.show({
        title: "Error",
        message: e.response?.data?.message || "Delete failed",
        color: "red",
      });
    }
  };

  // Quick-create type
  const handleQuickType = async (values: typeof quickTypeForm.values) => {
    try {
      const res = await api.post("/competencies/types", values);
      notifications.show({
        title: "Created",
        message: "Type created",
        color: "green",
      });
      setQuickTypeOpened(false);
      quickTypeForm.reset();
      onRefreshTypes();
      // Auto-select the newly created type
      form.setFieldValue(
        "competency_type_id",
        res.data.competency_type_id.toString(),
      );
    } catch (e: any) {
      notifications.show({
        title: "Error",
        message: e.response?.data?.message || "Failed to create type",
        color: "red",
      });
    }
  };

  // Quick-create cluster
  const handleQuickCluster = async (values: typeof quickClusterForm.values) => {
    try {
      const payload = {
        ...values,
        competency_type_id: parseInt(values.competency_type_id),
      };
      const res = await api.post("/competencies/clusters", payload);
      notifications.show({
        title: "Created",
        message: "Cluster created",
        color: "green",
      });
      setQuickClusterOpened(false);
      quickClusterForm.reset();
      onRefreshClusters();
      form.setFieldValue(
        "competency_cluster_id",
        res.data.competency_cluster_id.toString(),
      );
    } catch (e: any) {
      notifications.show({
        title: "Error",
        message: e.response?.data?.message || "Failed to create cluster",
        color: "red",
      });
    }
  };

  // When type changes, reset cluster selection
  useEffect(() => {
    if (selectedTypeId) {
      const currentCluster = form.values.competency_cluster_id;
      const stillValid = clusterOptions.some((o) => o.value === currentCluster);
      if (!stillValid) {
        form.setFieldValue("competency_cluster_id", "");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTypeId]);

  return (
    <>
      <Group justify="space-between" mb="md">
        <Text size="sm" c="dimmed">
          Step 3 — Assign a type and cluster to each competency. Use the +
          buttons to quick-create if needed.
        </Text>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={openCreate}
          variant="gradient"
          gradient={{ from: "indigo", to: "violet", deg: 135 }}
          size="sm"
        >
          Add Competency
        </Button>
      </Group>

      <Paper
        withBorder
        p={0}
        style={{
          overflow: "hidden",
          border: "1px solid var(--mantine-color-default-border)",
        }}
      >
        {loading ? (
          <Box p="xl" ta="center">
            <Loader size="sm" />
          </Box>
        ) : competencies.length === 0 ? (
          <EmptyState
            icon={IconBrain}
            label="No competencies yet"
            onAction={openCreate}
          />
        ) : (
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Competency</Table.Th>
                <Table.Th>Description</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Cluster</Table.Th>
                <Table.Th>Scope</Table.Th>
                <Table.Th w={100}>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {competencies.map((comp) => {
                const isGlobal = comp.client_id === 1;
                return (
                  <Table.Tr key={comp.competency_id}>
                    <Table.Td fw={500}>{comp.competency}</Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed" lineClamp={2}>
                        {comp.description}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="light" color="indigo" size="sm">
                        {comp.competencyType?.competency_type || "—"}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="light" color="teal" size="sm">
                        {comp.competencyCluster?.cluster_name || "—"}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        variant="light"
                        color={isGlobal ? "blue" : "green"}
                        size="sm"
                        leftSection={
                          isGlobal ? (
                            <IconWorld size={12} />
                          ) : (
                            <IconHome size={12} />
                          )
                        }
                      >
                        {isGlobal ? "Global" : "Local"}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      {isGlobal && user?.role !== "admin" ? (
                        <Text size="xs" c="dimmed">
                          Read-only
                        </Text>
                      ) : (
                        <Group gap={4} wrap="nowrap">
                          <Tooltip label="Edit">
                            <ActionIcon
                              variant="subtle"
                              color="blue"
                              onClick={() => openEdit(comp)}
                            >
                              <IconEdit size={16} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Delete">
                            <ActionIcon
                              variant="subtle"
                              color="red"
                              onClick={() => handleDelete(comp.competency_id)}
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      )}
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        )}
      </Paper>

      {/* ── Main Competency Modal with Inner Tabs ── */}
      <Modal
        opened={modalOpened}
        onClose={() => {
          setModalOpened(false);
          setModalQuestions([]);
          setModalTab("details");
        }}
        title={editingId ? "Edit Competency" : "New Competency"}
        size="xl"
      >
        <Tabs value={modalTab} onChange={(v) => setModalTab(v || "details")}>
          <Tabs.List mb="md">
            <Tabs.Tab value="details">Details</Tabs.Tab>
            {editingId && (
              <Tabs.Tab value="questions">
                Questions
                {modalQuestions.length > 0 && (
                  <Badge size="xs" variant="filled" color="orange" ml={6}>
                    {modalQuestions.length}
                  </Badge>
                )}
              </Tabs.Tab>
            )}
          </Tabs.List>

          <Tabs.Panel value="details">
            <form onSubmit={form.onSubmit(handleSubmit)}>
              <Stack>
                <TextInput
                  label="Competency Name"
                  placeholder="e.g. Analytical Thinking"
                  required
                  {...form.getInputProps("competency")}
                />
                <Textarea
                  label="Description"
                  placeholder="Describe this competency"
                  minRows={3}
                  {...form.getInputProps("description")}
                />
                <Textarea
                  label="Behavioral Indicators"
                  placeholder="Observable behaviors that demonstrate this competency"
                  minRows={2}
                  {...form.getInputProps("indicators")}
                />

                {/* Type select with quick-create */}
                <Box>
                  <Group gap={4} mb={4}>
                    <Text size="sm" fw={500}>
                      Type{" "}
                      <span style={{ color: "var(--mantine-color-red-6)" }}>
                        *
                      </span>
                    </Text>
                    <Tooltip label="Quick-create a new type">
                      <ActionIcon
                        variant="subtle"
                        size="xs"
                        color="indigo"
                        onClick={() => setQuickTypeOpened(true)}
                      >
                        <IconPlus size={14} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                  <Select
                    placeholder="Select type"
                    data={typeOptions}
                    required
                    searchable
                    {...form.getInputProps("competency_type_id")}
                  />
                </Box>

                {/* Cluster select with quick-create (cascading) */}
                <Box>
                  <Group gap={4} mb={4}>
                    <Text size="sm" fw={500}>
                      Cluster{" "}
                      <span style={{ color: "var(--mantine-color-red-6)" }}>
                        *
                      </span>
                    </Text>
                    <Tooltip label="Quick-create a new cluster">
                      <ActionIcon
                        variant="subtle"
                        size="xs"
                        color="teal"
                        onClick={() => {
                          quickClusterForm.setFieldValue(
                            "competency_type_id",
                            selectedTypeId || "",
                          );
                          setQuickClusterOpened(true);
                        }}
                      >
                        <IconPlus size={14} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                  <Select
                    placeholder={
                      selectedTypeId ? "Select cluster" : "Select a type first"
                    }
                    data={clusterOptions}
                    required
                    searchable
                    disabled={!selectedTypeId}
                    {...form.getInputProps("competency_cluster_id")}
                  />
                </Box>

                <Button
                  type="submit"
                  fullWidth
                  variant="gradient"
                  gradient={{ from: "indigo", to: "violet", deg: 135 }}
                >
                  {editingId ? "Update" : "Create"}
                </Button>
              </Stack>
            </form>
          </Tabs.Panel>

          {editingId && (
            <Tabs.Panel value="questions">
              <Stack>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    Manage questions for this competency
                  </Text>
                  <Button
                    size="xs"
                    leftSection={<IconPlus size={14} />}
                    variant="light"
                    color="orange"
                    onClick={() => {
                      qForm.reset();
                      qForm.setFieldValue(
                        "competency_id",
                        editingId.toString(),
                      );
                      setEditingQId(null);
                      setQModalOpened(true);
                    }}
                  >
                    Add Question
                  </Button>
                </Group>

                {loadingModalQ ? (
                  <Box ta="center" py="md">
                    <Loader size="sm" />
                  </Box>
                ) : modalQuestions.length === 0 ? (
                  <Text c="dimmed" ta="center" py="lg" size="sm">
                    No questions yet — click Add Question above
                  </Text>
                ) : (
                  <Stack gap="xs">
                    {[1, 2, 3, 4, 5].map((level) => {
                      const levelQs = modalQuestions.filter(
                        (q) => q.level === level,
                      );
                      return (
                        <Box key={level}>
                          <Group gap="xs" mb={4}>
                            <Badge
                              variant="filled"
                              color={levelColors[level] || "gray"}
                              size="sm"
                            >
                              Level {level}
                            </Badge>
                            <Badge variant="light" color="gray" size="xs">
                              {levelQs.length}
                            </Badge>
                          </Group>
                          {levelQs.length === 0 ? (
                            <Text size="xs" c="dimmed" ml="sm" mb="xs">
                              No questions
                            </Text>
                          ) : (
                            <Table mb="xs">
                              <Table.Tbody>
                                {levelQs.map((q) => (
                                  <Table.Tr key={q.competency_question_id}>
                                    <Table.Td>
                                      <Text size="sm" lineClamp={2}>
                                        {q.question}
                                      </Text>
                                    </Table.Td>
                                    <Table.Td w={60}>
                                      <Switch
                                        checked={q.status === "Active"}
                                        onChange={async () => {
                                          try {
                                            const newStatus =
                                              q.status === "Active"
                                                ? "Inactive"
                                                : "Active";
                                            await api.patch(
                                              `/cbi/questions/${q.competency_question_id}`,
                                              { status: newStatus },
                                            );
                                            fetchModalQuestions(editingId);
                                            onRefreshQuestions();
                                          } catch {
                                            notifications.show({
                                              title: "Error",
                                              message:
                                                "Failed to toggle status",
                                              color: "red",
                                            });
                                          }
                                        }}
                                        size="sm"
                                        color="green"
                                      />
                                    </Table.Td>
                                    <Table.Td w={70}>
                                      <Group gap={4} wrap="nowrap">
                                        <ActionIcon
                                          variant="subtle"
                                          color="blue"
                                          size="sm"
                                          onClick={() => {
                                            qForm.setValues({
                                              competency_id:
                                                q.competency_id.toString(),
                                              level: q.level,
                                              question: q.question,
                                            });
                                            setEditingQId(
                                              q.competency_question_id,
                                            );
                                            setQModalOpened(true);
                                          }}
                                        >
                                          <IconEdit size={14} />
                                        </ActionIcon>
                                        <ActionIcon
                                          variant="subtle"
                                          color="red"
                                          size="sm"
                                          onClick={async () => {
                                            try {
                                              await api.delete(
                                                `/cbi/questions/${q.competency_question_id}`,
                                              );
                                              fetchModalQuestions(editingId);
                                              onRefreshQuestions();
                                            } catch {
                                              notifications.show({
                                                title: "Error",
                                                message: "Delete failed",
                                                color: "red",
                                              });
                                            }
                                          }}
                                        >
                                          <IconTrash size={14} />
                                        </ActionIcon>
                                      </Group>
                                    </Table.Td>
                                  </Table.Tr>
                                ))}
                              </Table.Tbody>
                            </Table>
                          )}
                        </Box>
                      );
                    })}
                  </Stack>
                )}
              </Stack>

              {/* Inline question add/edit modal */}
              <Modal
                opened={qModalOpened}
                onClose={() => setQModalOpened(false)}
                title={editingQId ? "Edit Question" : "Add Question"}
                size="md"
              >
                <form
                  onSubmit={qForm.onSubmit(async (values) => {
                    try {
                      const payload = {
                        ...values,
                        competency_id: parseInt(values.competency_id),
                      };
                      if (editingQId) {
                        await api.patch(
                          `/cbi/questions/${editingQId}`,
                          payload,
                        );
                      } else {
                        await api.post("/cbi/questions", payload);
                      }
                      setQModalOpened(false);
                      qForm.reset();
                      setEditingQId(null);
                      fetchModalQuestions(editingId);
                      onRefreshQuestions();
                    } catch (e: any) {
                      notifications.show({
                        title: "Error",
                        message:
                          e.response?.data?.message || "Operation failed",
                        color: "red",
                      });
                    }
                  })}
                >
                  <Stack>
                    <Textarea
                      label="Question"
                      placeholder="Enter the interview question"
                      required
                      minRows={3}
                      {...qForm.getInputProps("question")}
                    />
                    <NumberInput
                      label="Level (1-5)"
                      min={1}
                      max={5}
                      required
                      {...qForm.getInputProps("level")}
                    />
                    <Button type="submit" fullWidth>
                      {editingQId ? "Update" : "Add"}
                    </Button>
                  </Stack>
                </form>
              </Modal>
            </Tabs.Panel>
          )}
        </Tabs>
      </Modal>

      {/* ── Quick-create Type Modal ── */}
      <Modal
        opened={quickTypeOpened}
        onClose={() => setQuickTypeOpened(false)}
        title="Quick-Create Type"
        size="sm"
      >
        <form onSubmit={quickTypeForm.onSubmit(handleQuickType)}>
          <Stack>
            <TextInput
              label="Type Name"
              placeholder="e.g. Technical"
              required
              {...quickTypeForm.getInputProps("competency_type")}
            />
            <Button
              type="submit"
              fullWidth
              variant="gradient"
              gradient={{ from: "indigo", to: "violet", deg: 135 }}
            >
              Create & Select
            </Button>
          </Stack>
        </form>
      </Modal>

      {/* ── Quick-create Cluster Modal ── */}
      <Modal
        opened={quickClusterOpened}
        onClose={() => setQuickClusterOpened(false)}
        title="Quick-Create Cluster"
        size="sm"
      >
        <form onSubmit={quickClusterForm.onSubmit(handleQuickCluster)}>
          <Stack>
            <TextInput
              label="Cluster Name"
              placeholder="e.g. Problem Solving"
              required
              {...quickClusterForm.getInputProps("cluster_name")}
            />
            <Textarea
              label="Description"
              placeholder="Optional description"
              minRows={2}
              {...quickClusterForm.getInputProps("description")}
            />
            <Select
              label="Parent Type"
              placeholder="Select type"
              data={typeOptions}
              required
              {...quickClusterForm.getInputProps("competency_type_id")}
            />
            <Button
              type="submit"
              fullWidth
              variant="gradient"
              gradient={{ from: "teal", to: "cyan", deg: 135 }}
            >
              Create & Select
            </Button>
          </Stack>
        </form>
      </Modal>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   QUESTIONS TAB
   ═══════════════════════════════════════════════════════════════════ */

const levelColors: Record<number, string> = {
  1: "green",
  2: "teal",
  3: "blue",
  4: "violet",
  5: "red",
};

function QuestionsTab({
  questions,
  competencies,
  types,
  clusters,
  loading,
  onRefresh,
}: {
  questions: CompetencyQuestion[];
  competencies: Competency[];
  types: CompetencyType[];
  clusters: CompetencyCluster[];
  loading: boolean;
  onRefresh: () => void;
}) {
  const { user } = useAuth();
  const [modalOpened, setModalOpened] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // URL-persisted filter state
  const f = useUrlFilters([
    "qType",
    "qCluster",
    "qComp",
    "qLevel",
    "qStatus",
  ] as const);
  const fType = f.get("qType");
  const fCluster = f.get("qCluster");
  const fComp = f.get("qComp");
  const fLevel = f.get("qLevel");
  const fStatus = f.get("qStatus");

  // Cascading filter options
  const typeOptions = types.map((t) => ({
    value: t.competency_type_id.toString(),
    label: t.competency_type,
  }));

  const filteredClusters = fType
    ? clusters.filter((c) => c.competency_type_id.toString() === fType)
    : clusters;
  const clusterOptions = filteredClusters.map((c) => ({
    value: c.competency_cluster_id.toString(),
    label: c.cluster_name,
  }));

  const filteredComps = competencies.filter((c) => {
    if (fType && c.competency_type_id.toString() !== fType) return false;
    if (fCluster && c.competency_cluster_id.toString() !== fCluster)
      return false;
    return true;
  });
  const compOptions = filteredComps.map((c) => ({
    value: c.competency_id.toString(),
    label: c.competency,
  }));

  // Apply all filters
  const filtered = questions.filter((q) => {
    if (fComp && q.competency_id.toString() !== fComp) return false;
    if (fLevel && q.level.toString() !== fLevel) return false;
    if (fStatus) {
      const isActive = q.status === "Active";
      if (fStatus === "Active" && !isActive) return false;
      if (fStatus === "Inactive" && isActive) return false;
    }
    // Type/cluster filter via competency relationship
    if (fType || fCluster) {
      const comp = competencies.find(
        (c) => c.competency_id === q.competency_id,
      );
      if (!comp) return false;
      if (fType && comp.competency_type_id.toString() !== fType) return false;
      if (fCluster && comp.competency_cluster_id.toString() !== fCluster)
        return false;
    }
    return true;
  });

  const form = useForm({
    initialValues: {
      competency_id: "",
      level: 1,
      question: "",
    },
    validate: {
      level: (value) =>
        value >= 1 && value <= 5 ? null : "Level must be between 1 and 5",
    },
  });

  const compSelectOptions = competencies.map((c) => ({
    value: c.competency_id.toString(),
    label: c.competency,
  }));

  const openCreate = () => {
    form.reset();
    setEditingId(null);
    setModalOpened(true);
  };

  const openEdit = (q: CompetencyQuestion) => {
    form.setValues({
      competency_id: q.competency_id.toString(),
      level: q.level,
      question: q.question,
    });
    setEditingId(q.competency_question_id);
    setModalOpened(true);
  };

  const handleSubmit = async (values: typeof form.values) => {
    try {
      const payload = {
        ...values,
        competency_id: parseInt(values.competency_id),
      };
      if (editingId) {
        await api.patch(`/cbi/questions/${editingId}`, payload);
        notifications.show({
          title: "Updated",
          message: "Question updated",
          color: "green",
        });
      } else {
        await api.post("/cbi/questions", payload);
        notifications.show({
          title: "Created",
          message: "Question created",
          color: "green",
        });
      }
      setModalOpened(false);
      form.reset();
      setEditingId(null);
      onRefresh();
    } catch (e: any) {
      notifications.show({
        title: "Error",
        message: e.response?.data?.message || "Operation failed",
        color: "red",
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this question?")) return;
    try {
      await api.delete(`/cbi/questions/${id}`);
      notifications.show({
        title: "Deleted",
        message: "Question deleted",
        color: "green",
      });
      onRefresh();
    } catch (e: any) {
      notifications.show({
        title: "Error",
        message: e.response?.data?.message || "Delete failed",
        color: "red",
      });
    }
  };

  return (
    <>
      <Group justify="space-between" mb="md">
        <Text size="sm" c="dimmed">
          Step 4 — Browse and filter all interview questions
        </Text>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={openCreate}
          variant="gradient"
          gradient={{ from: "orange", to: "yellow", deg: 135 }}
          size="sm"
        >
          Add Question
        </Button>
      </Group>

      {/* Cascading Filters + Table */}
      <Paper
        withBorder
        p="md"
        style={{
          border: "1px solid var(--mantine-color-default-border)",
        }}
      >
        <Group mb="md" gap="sm">
          <Select
            placeholder="All Types"
            data={typeOptions}
            value={fType}
            onChange={(v) => {
              f.set("qType", v);
              f.set("qCluster", null);
              f.set("qComp", null);
            }}
            clearable
            w={160}
          />
          <Select
            placeholder="All Clusters"
            data={clusterOptions}
            value={fCluster}
            onChange={(v) => {
              f.set("qCluster", v);
              f.set("qComp", null);
            }}
            clearable
            w={160}
            disabled={clusterOptions.length === 0}
          />
          <Select
            placeholder="All Competencies"
            data={compOptions}
            value={fComp}
            onChange={(v) => f.set("qComp", v)}
            clearable
            searchable
            w={200}
          />
          <Select
            placeholder="All Levels"
            data={[
              { value: "1", label: "Level 1" },
              { value: "2", label: "Level 2" },
              { value: "3", label: "Level 3" },
              { value: "4", label: "Level 4" },
              { value: "5", label: "Level 5" },
            ]}
            value={fLevel}
            onChange={(v) => f.set("qLevel", v)}
            clearable
            w={120}
          />
          <Select
            placeholder="All Statuses"
            data={[
              { value: "Active", label: "Active" },
              { value: "Inactive", label: "Inactive" },
            ]}
            value={fStatus}
            onChange={(v) => f.set("qStatus", v)}
            clearable
            w={120}
          />
          <Badge variant="light" color="gray" size="lg">
            {filtered.length} / {questions.length}
          </Badge>
        </Group>
        {loading ? (
          <Box p="xl" ta="center">
            <Loader size="sm" />
          </Box>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={IconQuestionMark}
            label="No questions yet"
            onAction={openCreate}
          />
        ) : (
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Question</Table.Th>
                <Table.Th>Competency</Table.Th>
                <Table.Th>Level</Table.Th>
                <Table.Th>Active</Table.Th>
                <Table.Th>Scope</Table.Th>
                <Table.Th w={100}>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filtered.map((q) => {
                const isGlobal = q.client_id === 1;
                return (
                  <Table.Tr key={q.competency_question_id}>
                    <Table.Td>
                      <Text size="sm" lineClamp={2}>
                        {q.question}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="light" color="indigo" size="sm">
                        {q.competency?.competency || "—"}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        variant="dot"
                        color={levelColors[q.level] || "gray"}
                        size="sm"
                      >
                        Level {q.level}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Switch
                        checked={q.status === "Active"}
                        onChange={async () => {
                          try {
                            const newStatus =
                              q.status === "Active" ? "Inactive" : "Active";
                            await api.patch(
                              `/cbi/questions/${q.competency_question_id}`,
                              { status: newStatus },
                            );
                            onRefresh();
                          } catch {
                            notifications.show({
                              title: "Error",
                              message: "Failed to toggle status",
                              color: "red",
                            });
                          }
                        }}
                        size="sm"
                        color="green"
                        disabled={isGlobal && user?.role !== "admin"}
                      />
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        variant="light"
                        color={isGlobal ? "blue" : "green"}
                        size="sm"
                        leftSection={
                          isGlobal ? (
                            <IconWorld size={12} />
                          ) : (
                            <IconHome size={12} />
                          )
                        }
                      >
                        {isGlobal ? "Global" : "Local"}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      {isGlobal && user?.role !== "admin" ? (
                        <Text size="xs" c="dimmed">
                          Read-only
                        </Text>
                      ) : (
                        <Group gap={4} wrap="nowrap">
                          <Tooltip label="Edit">
                            <ActionIcon
                              variant="subtle"
                              color="blue"
                              onClick={() => openEdit(q)}
                            >
                              <IconEdit size={16} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Delete">
                            <ActionIcon
                              variant="subtle"
                              color="red"
                              onClick={() =>
                                handleDelete(q.competency_question_id)
                              }
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      )}
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        )}
      </Paper>

      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        title={editingId ? "Edit Question" : "New Question"}
        size="lg"
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <Select
              label="Competency"
              placeholder="Select competency"
              data={compSelectOptions}
              required
              searchable
              {...form.getInputProps("competency_id")}
            />
            <NumberInput
              label="Level"
              placeholder="1-5"
              min={1}
              max={5}
              required
              {...form.getInputProps("level")}
            />
            <Textarea
              label="Question"
              placeholder="Enter the interview question"
              required
              minRows={4}
              {...form.getInputProps("question")}
            />
            <Button
              type="submit"
              fullWidth
              variant="gradient"
              gradient={{ from: "orange", to: "yellow", deg: 135 }}
            >
              {editingId ? "Update" : "Create"}
            </Button>
          </Stack>
        </form>
      </Modal>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN PAGE — Tabbed container
   ═══════════════════════════════════════════════════════════════════ */

export default function Competencies() {
  const {
    data: types = [],
    isLoading: loadingTypes,
    refetch: fetchTypes,
  } = useCompetencyTypes();
  const {
    data: clusters = [],
    isLoading: loadingClusters,
    refetch: fetchClusters,
  } = useCompetencyClusters();
  const {
    data: competencies = [],
    isLoading: loadingComps,
    refetch: fetchCompetencies,
  } = useCompetenciesQuery();
  const {
    data: questions = [],
    isLoading: loadingQuestions,
    refetch: fetchQuestions,
  } = useCompetencyQuestions();

  // ── URL-persisted state ──
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "types";
  const clusterFilterType = searchParams.get("clusterType") || null;

  const setActiveTab = (tab: string | null) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (tab) next.set("tab", tab);
        else next.delete("tab");
        return next;
      },
      { replace: true },
    );
  };

  const setClusterFilterType = (v: string | null) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (v) next.set("clusterType", v);
        else next.delete("clusterType");
        return next;
      },
      { replace: true },
    );
  };

  return (
    <Stack gap="lg">
      <Box>
        <Title order={2} fw={800}>
          Competencies
        </Title>
        <Text size="sm" c="dimmed">
          Manage competency types, clusters, competencies, and interview
          questions
        </Text>
      </Box>

      {/* ── Visual flow banner ── */}
      <Paper
        withBorder
        p="sm"
        style={{ border: "1px solid var(--mantine-color-default-border)" }}
      >
        <Group justify="center" gap="xs">
          {[
            { icon: IconCategory, label: "Types", color: "indigo", step: 1 },
            { icon: IconSitemap, label: "Clusters", color: "teal", step: 2 },
            {
              icon: IconListDetails,
              label: "Competencies",
              color: "violet",
              step: 3,
            },
            {
              icon: IconQuestionMark,
              label: "Questions",
              color: "orange",
              step: 4,
            },
          ].map((item, i) => (
            <Group key={item.label} gap="xs" wrap="nowrap">
              {i > 0 && (
                <IconChevronRight
                  size={14}
                  style={{
                    color: "var(--mantine-color-dimmed)",
                    flexShrink: 0,
                  }}
                />
              )}
              <Badge
                variant="light"
                color={item.color}
                size="lg"
                leftSection={<item.icon size={14} />}
                style={{ cursor: "default" }}
              >
                {item.step}. {item.label}
              </Badge>
            </Group>
          ))}
        </Group>
      </Paper>

      <Tabs
        value={activeTab}
        onChange={setActiveTab}
        variant="outline"
        radius="md"
      >
        <Tabs.List>
          <Tabs.Tab value="types" leftSection={<IconCategory size={16} />}>
            Types
            {types.length > 0 && (
              <Badge size="xs" variant="filled" color="indigo" ml={6}>
                {types.length}
              </Badge>
            )}
          </Tabs.Tab>
          <Tabs.Tab value="clusters" leftSection={<IconSitemap size={16} />}>
            Clusters
            {clusters.length > 0 && (
              <Badge size="xs" variant="filled" color="teal" ml={6}>
                {clusters.length}
              </Badge>
            )}
          </Tabs.Tab>
          <Tabs.Tab
            value="competencies"
            leftSection={<IconListDetails size={16} />}
          >
            Competencies
            {competencies.length > 0 && (
              <Badge size="xs" variant="filled" color="violet" ml={6}>
                {competencies.length}
              </Badge>
            )}
          </Tabs.Tab>
          <Tabs.Tab
            value="questions"
            leftSection={<IconQuestionMark size={16} />}
          >
            Questions
            {questions.length > 0 && (
              <Badge size="xs" variant="filled" color="orange" ml={6}>
                {questions.length}
              </Badge>
            )}
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="types" pt="md">
          <TypesTab
            types={types}
            loading={loadingTypes}
            onRefresh={fetchTypes}
          />
        </Tabs.Panel>

        <Tabs.Panel value="clusters" pt="md">
          <ClustersTab
            clusters={clusters}
            types={types}
            loading={loadingClusters}
            onRefresh={() => {
              fetchClusters();
            }}
            filterTypeId={clusterFilterType}
            onFilterTypeChange={setClusterFilterType}
          />
        </Tabs.Panel>

        <Tabs.Panel value="competencies" pt="md">
          <CompetenciesTab
            competencies={competencies}
            types={types}
            clusters={clusters}
            loading={loadingComps}
            onRefresh={fetchCompetencies}
            onRefreshTypes={fetchTypes}
            onRefreshClusters={fetchClusters}
            onRefreshQuestions={fetchQuestions}
          />
        </Tabs.Panel>

        <Tabs.Panel value="questions" pt="md">
          <QuestionsTab
            questions={questions}
            competencies={competencies}
            types={types}
            clusters={clusters}
            loading={loadingQuestions}
            onRefresh={fetchQuestions}
          />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}
