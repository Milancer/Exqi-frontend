import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Title,
  Button,
  Table,
  Modal,
  TextInput,
  Textarea,
  Select,
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
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconCategory,
  IconSitemap,
  IconListDetails,
  IconChevronRight,
} from "@tabler/icons-react";
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";

import type {
  JpCompetencyType,
  JpCompetencyCluster,
  JpCompetency,
} from "../services/jp-competencies/interfaces";

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
    <Box p="xl" ta="center">
      <Stack align="center" gap="xs">
        <Icon
          size={40}
          stroke={1}
          style={{ color: "var(--mantine-color-dimmed)" }}
        />
        <Text size="sm" c="dimmed">
          {label}
        </Text>
        <Button
          size="xs"
          variant="light"
          onClick={onAction}
          leftSection={<IconPlus size={14} />}
        >
          Create one
        </Button>
      </Stack>
    </Box>
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
  types: JpCompetencyType[];
  loading: boolean;
  onRefresh: () => void;
}) {
  const { user } = useAuth();
  const [modalOpened, setModalOpened] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const form = useForm({
    initialValues: { competency_type: "", status: "Active" },
  });

  const openCreate = () => {
    form.reset();
    setEditingId(null);
    setModalOpened(true);
  };

  const openEdit = (t: JpCompetencyType) => {
    form.setValues({ competency_type: t.competency_type, status: t.status });
    setEditingId(t.jp_competency_type_id);
    setModalOpened(true);
  };

  const handleSubmit = async (values: typeof form.values) => {
    try {
      if (editingId) {
        await api.patch(`/job-profiles/competency-types/${editingId}`, values);
        notifications.show({
          title: "Updated",
          message: "JP competency type updated",
          color: "green",
        });
      } else {
        await api.post("/job-profiles/competency-types", values);
        notifications.show({
          title: "Created",
          message: "JP competency type created",
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
    if (!confirm("Delete this type?")) return;
    try {
      await api.delete(`/job-profiles/competency-types/${id}`);
      notifications.show({
        title: "Deleted",
        message: "JP competency type deleted",
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
          Step 1 — Define the high-level competency categories for job profiles
        </Text>
        {user?.role === "admin" && (
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={openCreate}
            variant="gradient"
            gradient={{ from: "indigo", to: "violet", deg: 135 }}
            size="sm"
          >
            Add Type
          </Button>
        )}
      </Group>

      <Paper
        withBorder
        p="md"
        style={{ border: "1px solid var(--mantine-color-default-border)" }}
      >
        {loading ? (
          <Box p="xl" ta="center">
            <Loader size="sm" />
          </Box>
        ) : types.length === 0 ? (
          <EmptyState
            icon={IconCategory}
            label="No types yet"
            onAction={openCreate}
          />
        ) : (
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Type</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th w={100}>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {types.map((t) => (
                <Table.Tr key={t.jp_competency_type_id}>
                  <Table.Td fw={500}>{t.competency_type}</Table.Td>
                  <Table.Td>
                    <Badge
                      variant="dot"
                      color={t.status === "Active" ? "green" : "gray"}
                    >
                      {t.status}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
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
                          onClick={() => handleDelete(t.jp_competency_type_id)}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Paper>

      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        title={editingId ? "Edit Type" : "New Type"}
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
  clusters: JpCompetencyCluster[];
  types: JpCompetencyType[];
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
      jp_competency_type_id: "",
      cluster_name: "",
      description: "",
      status: "Active",
    },
  });

  const typeOptions = types.map((t) => ({
    value: t.jp_competency_type_id.toString(),
    label: t.competency_type,
  }));

  const filtered = filterTypeId
    ? clusters.filter(
        (c) => c.jp_competency_type_id.toString() === filterTypeId,
      )
    : clusters;

  const openCreate = () => {
    form.reset();
    setEditingId(null);
    setModalOpened(true);
  };

  const openEdit = (c: JpCompetencyCluster) => {
    form.setValues({
      jp_competency_type_id: c.jp_competency_type_id.toString(),
      cluster_name: c.cluster_name,
      description: c.description || "",
      status: c.status,
    });
    setEditingId(c.jp_competency_cluster_id);
    setModalOpened(true);
  };

  const handleSubmit = async (values: typeof form.values) => {
    try {
      const payload = {
        ...values,
        jp_competency_type_id: parseInt(values.jp_competency_type_id),
      };
      if (editingId) {
        await api.patch(
          `/job-profiles/competency-clusters/${editingId}`,
          payload,
        );
        notifications.show({
          title: "Updated",
          message: "JP cluster updated",
          color: "green",
        });
      } else {
        await api.post("/job-profiles/competency-clusters", payload);
        notifications.show({
          title: "Created",
          message: "JP cluster created",
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
    if (!confirm("Delete this cluster?")) return;
    try {
      await api.delete(`/job-profiles/competency-clusters/${id}`);
      notifications.show({
        title: "Deleted",
        message: "JP cluster deleted",
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
            Step 2 — Group competencies into clusters
          </Text>
          <Select
            placeholder="Filter by type"
            data={typeOptions}
            value={filterTypeId}
            onChange={onFilterTypeChange}
            clearable
            size="xs"
            w={160}
          />
          <Badge variant="light" color="gray" size="lg">
            {filtered.length} / {clusters.length}
          </Badge>
        </Group>
        {user?.role === "admin" && (
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={openCreate}
            variant="gradient"
            gradient={{ from: "teal", to: "cyan", deg: 135 }}
            size="sm"
          >
            Add Cluster
          </Button>
        )}
      </Group>

      <Paper
        withBorder
        p="md"
        style={{ border: "1px solid var(--mantine-color-default-border)" }}
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
                <Table.Th>Cluster</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Description</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th w={100}>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filtered.map((c) => (
                <Table.Tr key={c.jp_competency_cluster_id}>
                  <Table.Td fw={500}>{c.cluster_name}</Table.Td>
                  <Table.Td>
                    <Badge variant="light" color="indigo" size="sm">
                      {c.competencyType?.competency_type || "—"}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" lineClamp={1}>
                      {c.description || "—"}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      variant="dot"
                      color={c.status === "Active" ? "green" : "gray"}
                    >
                      {c.status}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
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
                            handleDelete(c.jp_competency_cluster_id)
                          }
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Paper>

      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        title={editingId ? "Edit Cluster" : "New Cluster"}
        size="md"
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <Select
              label="Parent Type"
              placeholder="Select type"
              data={typeOptions}
              required
              {...form.getInputProps("jp_competency_type_id")}
            />
            <TextInput
              label="Cluster Name"
              placeholder="e.g. Problem Solving"
              required
              {...form.getInputProps("cluster_name")}
            />
            <Textarea
              label="Description"
              placeholder="Optional description"
              minRows={2}
              {...form.getInputProps("description")}
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
}: {
  competencies: JpCompetency[];
  types: JpCompetencyType[];
  clusters: JpCompetencyCluster[];
  loading: boolean;
  onRefresh: () => void;
  onRefreshTypes: () => void;
  onRefreshClusters: () => void;
}) {
  const { user } = useAuth();
  const [modalOpened, setModalOpened] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Quick-create modals
  const [quickTypeOpened, setQuickTypeOpened] = useState(false);
  const [quickClusterOpened, setQuickClusterOpened] = useState(false);

  const form = useForm({
    initialValues: {
      jp_competency_type_id: "",
      jp_competency_cluster_id: "",
      competency: "",
      description: "",
      indicators: "",
      status: "Active",
    },
  });

  const quickTypeForm = useForm({
    initialValues: { competency_type: "" },
  });

  const quickClusterForm = useForm({
    initialValues: {
      cluster_name: "",
      description: "",
      jp_competency_type_id: "",
    },
  });

  const typeOptions = types.map((t) => ({
    value: t.jp_competency_type_id.toString(),
    label: t.competency_type,
  }));

  const selectedTypeId = form.values.jp_competency_type_id;
  const filteredClusters = selectedTypeId
    ? clusters.filter(
        (c) => c.jp_competency_type_id.toString() === selectedTypeId,
      )
    : clusters;
  const clusterOptions = filteredClusters.map((c) => ({
    value: c.jp_competency_cluster_id.toString(),
    label: c.cluster_name,
  }));

  const openCreate = () => {
    form.reset();
    setEditingId(null);
    setModalOpened(true);
  };

  const openEdit = (comp: JpCompetency) => {
    form.setValues({
      jp_competency_type_id: comp.jp_competency_type_id.toString(),
      jp_competency_cluster_id: comp.jp_competency_cluster_id.toString(),
      competency: comp.competency,
      description: comp.description || "",
      indicators: comp.indicators || "",
      status: comp.status,
    });
    setEditingId(comp.jp_competency_id);
    setModalOpened(true);
  };

  const handleSubmit = async (values: typeof form.values) => {
    try {
      const payload = {
        ...values,
        jp_competency_type_id: parseInt(values.jp_competency_type_id),
        jp_competency_cluster_id: parseInt(values.jp_competency_cluster_id),
      };
      if (editingId) {
        await api.patch(`/job-profiles/competency-items/${editingId}`, payload);
        notifications.show({
          title: "Updated",
          message: "JP competency updated",
          color: "green",
        });
      } else {
        await api.post("/job-profiles/competency-items", payload);
        notifications.show({
          title: "Created",
          message: "JP competency created",
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
      await api.delete(`/job-profiles/competency-items/${id}`);
      notifications.show({
        title: "Deleted",
        message: "JP competency deleted",
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
      const res = await api.post("/job-profiles/competency-types", values);
      notifications.show({
        title: "Created",
        message: "Type created",
        color: "green",
      });
      onRefreshTypes();
      form.setFieldValue(
        "jp_competency_type_id",
        res.data.jp_competency_type_id.toString(),
      );
      setQuickTypeOpened(false);
      quickTypeForm.reset();
    } catch (e: any) {
      notifications.show({
        title: "Error",
        message: e.response?.data?.message || "Failed",
        color: "red",
      });
    }
  };

  // Quick-create cluster
  const handleQuickCluster = async (values: typeof quickClusterForm.values) => {
    try {
      const payload = {
        ...values,
        jp_competency_type_id: parseInt(
          values.jp_competency_type_id || selectedTypeId,
        ),
      };
      const res = await api.post("/job-profiles/competency-clusters", payload);
      notifications.show({
        title: "Created",
        message: "Cluster created",
        color: "green",
      });
      onRefreshClusters();
      form.setFieldValue(
        "jp_competency_cluster_id",
        res.data.jp_competency_cluster_id.toString(),
      );
      setQuickClusterOpened(false);
      quickClusterForm.reset();
    } catch (e: any) {
      notifications.show({
        title: "Error",
        message: e.response?.data?.message || "Failed",
        color: "red",
      });
    }
  };

  return (
    <>
      <Group justify="space-between" mb="md">
        <Text size="sm" c="dimmed">
          Step 3 — Define specific competencies within clusters
        </Text>
        {user?.role === "admin" && (
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={openCreate}
            variant="gradient"
            gradient={{ from: "violet", to: "grape", deg: 135 }}
            size="sm"
          >
            Add Competency
          </Button>
        )}
      </Group>

      <Paper
        withBorder
        p="md"
        style={{ border: "1px solid var(--mantine-color-default-border)" }}
      >
        {loading ? (
          <Box p="xl" ta="center">
            <Loader size="sm" />
          </Box>
        ) : competencies.length === 0 ? (
          <EmptyState
            icon={IconListDetails}
            label="No competencies yet"
            onAction={openCreate}
          />
        ) : (
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Competency</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Cluster</Table.Th>
                <Table.Th>Description</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th w={100}>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {competencies.map((c) => (
                <Table.Tr key={c.jp_competency_id}>
                  <Table.Td fw={500}>{c.competency}</Table.Td>
                  <Table.Td>
                    <Badge variant="light" color="indigo" size="sm">
                      {c.competencyType?.competency_type || "—"}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Badge variant="light" color="teal" size="sm">
                      {c.competencyCluster?.cluster_name || "—"}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" lineClamp={1}>
                      {c.description || "—"}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      variant="dot"
                      color={c.status === "Active" ? "green" : "gray"}
                    >
                      {c.status}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
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
                          onClick={() => handleDelete(c.jp_competency_id)}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Paper>

      {/* ── Main Competency Modal ── */}
      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        title={editingId ? "Edit Competency" : "New Competency"}
        size="lg"
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <Group grow align="end">
              <Select
                label="Type"
                placeholder="Select type"
                data={typeOptions}
                required
                {...form.getInputProps("jp_competency_type_id")}
                onChange={(v) => {
                  form.setFieldValue("jp_competency_type_id", v || "");
                  form.setFieldValue("jp_competency_cluster_id", "");
                }}
              />
              <Button
                variant="light"
                size="xs"
                onClick={() => setQuickTypeOpened(true)}
              >
                + Type
              </Button>
            </Group>
            <Group grow align="end">
              <Select
                label="Cluster"
                placeholder="Select cluster"
                data={clusterOptions}
                required
                disabled={!selectedTypeId}
                {...form.getInputProps("jp_competency_cluster_id")}
              />
              <Button
                variant="light"
                size="xs"
                onClick={() => setQuickClusterOpened(true)}
                disabled={!selectedTypeId}
              >
                + Cluster
              </Button>
            </Group>
            <TextInput
              label="Competency Name"
              placeholder="e.g. Problem Solving"
              required
              {...form.getInputProps("competency")}
            />
            <Textarea
              label="Description"
              placeholder="Detailed description"
              minRows={2}
              {...form.getInputProps("description")}
            />
            <Textarea
              label="Behavioral Indicators"
              placeholder="Observable behaviors"
              minRows={2}
              {...form.getInputProps("indicators")}
            />
            <Button
              type="submit"
              fullWidth
              variant="gradient"
              gradient={{ from: "violet", to: "grape", deg: 135 }}
            >
              {editingId ? "Update" : "Create"}
            </Button>
          </Stack>
        </form>
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
              {...quickClusterForm.getInputProps("jp_competency_type_id")}
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
   MAIN PAGE — Tabbed container
   ═══════════════════════════════════════════════════════════════════ */

export default function JpCompetencies() {
  const [types, setTypes] = useState<JpCompetencyType[]>([]);
  const [clusters, setClusters] = useState<JpCompetencyCluster[]>([]);
  const [competencies, setCompetencies] = useState<JpCompetency[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [loadingClusters, setLoadingClusters] = useState(true);
  const [loadingComps, setLoadingComps] = useState(true);

  const fetchTypes = useCallback(async () => {
    try {
      const res = await api.get("/job-profiles/competency-types");
      setTypes(res.data);
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to fetch JP types",
        color: "red",
      });
    } finally {
      setLoadingTypes(false);
    }
  }, []);

  const fetchClusters = useCallback(async () => {
    try {
      const res = await api.get("/job-profiles/competency-clusters");
      setClusters(res.data);
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to fetch JP clusters",
        color: "red",
      });
    } finally {
      setLoadingClusters(false);
    }
  }, []);

  const fetchCompetencies = useCallback(async () => {
    try {
      const res = await api.get("/job-profiles/competency-items");
      setCompetencies(res.data);
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to fetch JP competencies",
        color: "red",
      });
    } finally {
      setLoadingComps(false);
    }
  }, []);

  useEffect(() => {
    fetchTypes();
    fetchClusters();
    fetchCompetencies();
  }, [fetchTypes, fetchClusters, fetchCompetencies]);

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
          Job Profile Competencies
        </Title>
        <Text size="sm" c="dimmed">
          Manage competency types, clusters, and competencies for job profiles
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
          />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}
