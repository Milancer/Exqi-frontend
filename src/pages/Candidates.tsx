import { useState, useEffect, useMemo } from "react";
import {
  Title,
  Button,
  Table,
  Modal,
  TextInput,
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
} from "@mantine/core";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconUserSearch,
} from "@tabler/icons-react";
import { useForm } from "@mantine/form";
import api from "../lib/api";
import { useUrlFilters } from "../hooks/useUrlFilters";

interface Candidate {
  candidate_id: number;
  name: string;
  surname: string;
  email: string;
  phone: string;
  position: string;
  client_id: number;
  status: string;
  created_at: string;
}

export default function Candidates() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpened, setModalOpened] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const f = useUrlFilters(["search", "position"] as const);

  const form = useForm({
    initialValues: {
      name: "",
      surname: "",
      email: "",
      phone: "",
      position: "",
    },
  });

  const fetchCandidates = async () => {
    try {
      const res = await api.get("/candidates");
      setCandidates(res.data);
    } catch (err) {
      console.error("Failed to fetch candidates", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const positionOptions = useMemo(
    () =>
      [...new Set(candidates.map((c) => c.position).filter(Boolean))]
        .sort()
        .map((v) => ({ value: v, label: v })),
    [candidates],
  );

  const filtered = useMemo(() => {
    const search = f.get("search")?.toLowerCase();
    const position = f.get("position");
    return candidates.filter((c) => {
      if (
        search &&
        !`${c.name} ${c.surname}`.toLowerCase().includes(search) &&
        !(c.email || "").toLowerCase().includes(search)
      )
        return false;
      if (position && c.position !== position) return false;
      return true;
    });
  }, [candidates, f]);

  const handleSubmit = async (values: typeof form.values) => {
    try {
      if (editingId) {
        await api.patch(`/candidates/${editingId}`, values);
      } else {
        await api.post("/candidates", values);
      }
      setModalOpened(false);
      form.reset();
      setEditingId(null);
      fetchCandidates();
    } catch (err) {
      console.error("Failed to save candidate", err);
    }
  };

  const handleEdit = (c: Candidate) => {
    setEditingId(c.candidate_id);
    form.setValues({
      name: c.name,
      surname: c.surname,
      email: c.email || "",
      phone: c.phone || "",
      position: c.position,
    });
    setModalOpened(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Archive this candidate?")) return;
    try {
      await api.delete(`/candidates/${id}`);
      fetchCandidates();
    } catch (err) {
      console.error("Failed to archive candidate", err);
    }
  };

  const openCreate = () => {
    setEditingId(null);
    form.reset();
    setModalOpened(true);
  };

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-end">
        <Box>
          <Title order={2} fw={800}>
            Candidates
          </Title>
          <Text size="sm" c="dimmed">
            Manage interview candidates
          </Text>
        </Box>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={openCreate}
          variant="gradient"
          gradient={{ from: "indigo", to: "violet", deg: 135 }}
          size="sm"
        >
          Add Candidate
        </Button>
      </Group>

      {/* Filters + Table */}
      <Paper
        withBorder
        p="md"
        style={{ border: "1px solid var(--mantine-color-default-border)" }}
      >
        <Group gap="sm" mb="md">
          <TextInput
            placeholder="Search name or email…"
            value={f.get("search") || ""}
            onChange={(e) => f.set("search", e.currentTarget.value || null)}
            style={{ flex: 1, maxWidth: 260 }}
          />
          <Select
            placeholder="All Positions"
            data={positionOptions}
            value={f.get("position")}
            onChange={(v) => f.set("position", v)}
            clearable
            searchable
            w={200}
          />
          <Badge variant="light" color="gray" size="lg">
            {filtered.length} / {candidates.length}
          </Badge>
        </Group>

        {loading ? (
          <Center p="xl">
            <Loader />
          </Center>
        ) : filtered.length === 0 ? (
          <Stack align="center" py={60} gap="md">
            <IconUserSearch
              size={48}
              stroke={1}
              style={{ color: "var(--mantine-color-dimmed)" }}
            />
            <Text c="dimmed" size="lg">
              {candidates.length === 0
                ? "No candidates yet"
                : "No candidates match filters"}
            </Text>
            {candidates.length === 0 && (
              <Button onClick={openCreate} variant="light">
                Add your first candidate
              </Button>
            )}
          </Stack>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th>Phone</Table.Th>
                <Table.Th>Position</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th w={80}>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filtered.map((c) => (
                <Table.Tr key={c.candidate_id}>
                  <Table.Td fw={500}>
                    {c.name} {c.surname}
                  </Table.Td>
                  <Table.Td>{c.email || "—"}</Table.Td>
                  <Table.Td>{c.phone || "—"}</Table.Td>
                  <Table.Td>
                    <Badge variant="light" color="blue">
                      {c.position}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      color={c.status === "Active" ? "green" : "gray"}
                      variant="light"
                    >
                      {c.status}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4}>
                      <Tooltip label="Edit">
                        <ActionIcon
                          variant="subtle"
                          onClick={() => handleEdit(c)}
                        >
                          <IconEdit size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Archive">
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          onClick={() => handleDelete(c.candidate_id)}
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

      {/* Create/Edit Modal */}
      <Modal
        opened={modalOpened}
        onClose={() => {
          setModalOpened(false);
          setEditingId(null);
          form.reset();
        }}
        title={editingId ? "Edit Candidate" : "Add Candidate"}
        size="md"
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="sm">
            <Group grow>
              <TextInput
                label="Name"
                required
                {...form.getInputProps("name")}
              />
              <TextInput
                label="Surname"
                required
                {...form.getInputProps("surname")}
              />
            </Group>
            <TextInput label="Email" {...form.getInputProps("email")} />
            <TextInput label="Phone" {...form.getInputProps("phone")} />
            <TextInput
              label="Position"
              required
              placeholder="e.g. Software Engineer"
              {...form.getInputProps("position")}
            />
            <Button type="submit" fullWidth mt="sm">
              {editingId ? "Save Changes" : "Add Candidate"}
            </Button>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}
