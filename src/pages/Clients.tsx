import { useState, useMemo } from "react";
import {
  Stack,
  Box,
  Title,
  Text,
  Button,
  Group,
  Paper,
  Table,
  Modal,
  TextInput,
  MultiSelect,
  Badge,
  ActionIcon,
  Loader,
  Center,
  Divider,
  Select,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconBuilding,
} from "@tabler/icons-react";
import { useUrlFilters } from "../hooks/useUrlFilters";
import type { Client } from "../services/clients/interfaces";
import {
  useClients,
  useCreateClient,
  useUpdateClient,
  useDeleteClient,
} from "../services/clients/hooks";

const moduleOptions = [
  { value: "Job Profile", label: "Job Profile" },
  { value: "Competency Based Interview", label: "Competency Based Interview" },
];

export default function Clients() {
  const { data: clients = [], isLoading: loading } = useClients();
  const createMutation = useCreateClient();
  const updateMutation = useUpdateClient();
  const deleteMutation = useDeleteClient();

  const [modalOpened, setModalOpened] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // URL-persisted filters
  const f = useUrlFilters(["search", "industry", "module"] as const);

  const form = useForm({
    initialValues: {
      name: "",
      industry: "",
      division: "",
      contactName: "",
      contactSurname: "",
      position: "",
      contactPhoneNumber: "",
      contactEmail: "",
      hrContactName: "",
      hrContactSurname: "",
      hrContactPhoneNumber: "",
      hrContactEmail: "",
      modules: [] as string[],
    },
    validate: {
      name: (v) => (v.trim() ? null : "Name is required"),
      industry: (v) => (v.trim() ? null : "Industry is required"),
      division: (v) => (v.trim() ? null : "Division is required"),
      contactName: (v) => (v.trim() ? null : "Required"),
      contactSurname: (v) => (v.trim() ? null : "Required"),
      position: (v) => (v.trim() ? null : "Required"),
      contactPhoneNumber: (v) => (v.trim() ? null : "Required"),
      contactEmail: (v) => (/^\S+@\S+$/.test(v) ? null : "Invalid email"),
      hrContactName: (v) => (v.trim() ? null : "Required"),
      hrContactSurname: (v) => (v.trim() ? null : "Required"),
      hrContactPhoneNumber: (v) => (v.trim() ? null : "Required"),
      hrContactEmail: (v) => (/^\S+@\S+$/.test(v) ? null : "Invalid email"),
    },
  });

  const openCreate = () => {
    form.reset();
    setEditingId(null);
    setModalOpened(true);
  };

  const openEdit = (c: Client) => {
    form.setValues({
      name: c.name,
      industry: c.industry,
      division: c.division,
      contactName: c.contactName,
      contactSurname: c.contactSurname,
      position: c.position,
      contactPhoneNumber: c.contactPhoneNumber,
      contactEmail: c.contactEmail,
      hrContactName: c.hrContactName,
      hrContactSurname: c.hrContactSurname,
      hrContactPhoneNumber: c.hrContactPhoneNumber,
      hrContactEmail: c.hrContactEmail,
      modules: c.modules || [],
    });
    setEditingId(c.id);
    setModalOpened(true);
  };

  const handleSubmit = async (values: typeof form.values) => {
    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: values });
        notifications.show({
          title: "Updated",
          message: "Client updated",
          color: "green",
        });
      } else {
        await createMutation.mutateAsync(values);
        notifications.show({
          title: "Created",
          message: "Client created",
          color: "green",
        });
      }
      setModalOpened(false);
      form.reset();
      setEditingId(null);
    } catch (e: any) {
      notifications.show({
        title: "Error",
        message: e.response?.data?.message || "Operation failed",
        color: "red",
      });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
      notifications.show({
        title: "Deleted",
        message: "Client removed",
        color: "green",
      });
    } catch (e: any) {
      notifications.show({
        title: "Error",
        message: e.response?.data?.message || "Delete failed",
        color: "red",
      });
    }
  };

  // Derived filter options from data
  const industryOptions = useMemo(
    () =>
      [...new Set(clients.map((c) => c.industry).filter(Boolean))]
        .sort()
        .map((v) => ({ value: v, label: v })),
    [clients],
  );

  // Filtered rows
  const filtered = useMemo(() => {
    const search = f.get("search")?.toLowerCase();
    const industry = f.get("industry");
    const mod = f.get("module");
    return clients.filter((c) => {
      if (search && !c.name.toLowerCase().includes(search)) return false;
      if (industry && c.industry !== industry) return false;
      if (mod && !(c.modules || []).includes(mod)) return false;
      return true;
    });
  }, [clients, f]);

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-end">
        <Box>
          <Title order={2} fw={800}>
            Clients
          </Title>
          <Text size="sm" c="dimmed">
            Manage client organisations, contacts, and module assignments
          </Text>
        </Box>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={openCreate}
          variant="gradient"
          gradient={{ from: "teal", to: "cyan", deg: 135 }}
          size="sm"
        >
          Add Client
        </Button>
      </Group>

      {/* Filters + Table */}
      <Paper
        withBorder
        p="md"
        style={{
          border: "1px solid var(--mantine-color-default-border)",
        }}
      >
        <Group gap="sm" mb="md">
          <TextInput
            placeholder="Search company…"
            value={f.get("search") || ""}
            onChange={(e) => f.set("search", e.currentTarget.value || null)}
            style={{ flex: 1, maxWidth: 220 }}
          />
          <Select
            placeholder="All Industries"
            data={industryOptions}
            value={f.get("industry")}
            onChange={(v) => f.set("industry", v)}
            clearable
            w={180}
          />
          <Select
            placeholder="All Modules"
            data={moduleOptions}
            value={f.get("module")}
            onChange={(v) => f.set("module", v)}
            clearable
            w={220}
          />
          <Badge variant="light" color="gray" size="lg">
            {filtered.length} / {clients.length}
          </Badge>
        </Group>
        {loading ? (
          <Center p="xl">
            <Loader />
          </Center>
        ) : filtered.length === 0 ? (
          <Center p="xl">
            <Stack align="center" gap="xs">
              <IconBuilding size={48} style={{ opacity: 0.3 }} />
              <Text c="dimmed">
                {clients.length === 0
                  ? "No clients yet"
                  : "No clients match filters"}
              </Text>
              {clients.length === 0 && (
                <Button size="xs" variant="light" onClick={openCreate}>
                  Add first client
                </Button>
              )}
            </Stack>
          </Center>
        ) : (
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Company</Table.Th>
                <Table.Th>Industry</Table.Th>
                <Table.Th>Division</Table.Th>
                <Table.Th>Primary Contact</Table.Th>
                <Table.Th>Modules</Table.Th>
                <Table.Th style={{ width: 100 }}>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filtered.map((c) => (
                <Table.Tr key={c.id}>
                  <Table.Td fw={500}>{c.name}</Table.Td>
                  <Table.Td>{c.industry}</Table.Td>
                  <Table.Td>{c.division}</Table.Td>
                  <Table.Td>
                    {c.contactName} {c.contactSurname}
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4}>
                      {(c.modules || []).map((m) => (
                        <Badge key={m} size="xs" variant="light" color="blue">
                          {m}
                        </Badge>
                      ))}
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4}>
                      <ActionIcon
                        variant="subtle"
                        color="blue"
                        onClick={() => openEdit(c)}
                      >
                        <IconEdit size={16} />
                      </ActionIcon>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        onClick={() => handleDelete(c.id)}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
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
        title={editingId ? "Edit Client" : "New Client"}
        size="xl"
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <Text fw={600} size="sm" c="dimmed">
              Company Details
            </Text>
            <Group grow>
              <TextInput
                label="Company Name"
                placeholder="Acme Corp"
                required
                {...form.getInputProps("name")}
              />
              <TextInput
                label="Industry"
                placeholder="Financial Services"
                required
                {...form.getInputProps("industry")}
              />
              <TextInput
                label="Division"
                placeholder="HR"
                required
                {...form.getInputProps("division")}
              />
            </Group>

            <Divider my="xs" label="Primary Contact" labelPosition="left" />
            <Group grow>
              <TextInput
                label="Name"
                placeholder="John"
                required
                {...form.getInputProps("contactName")}
              />
              <TextInput
                label="Surname"
                placeholder="Doe"
                required
                {...form.getInputProps("contactSurname")}
              />
              <TextInput
                label="Position"
                placeholder="HR Director"
                required
                {...form.getInputProps("position")}
              />
            </Group>
            <Group grow>
              <TextInput
                label="Phone"
                placeholder="+27..."
                required
                {...form.getInputProps("contactPhoneNumber")}
              />
              <TextInput
                label="Email"
                placeholder="john@acme.com"
                required
                {...form.getInputProps("contactEmail")}
              />
            </Group>

            <Divider my="xs" label="HR Contact" labelPosition="left" />
            <Group grow>
              <TextInput
                label="Name"
                placeholder="Jane"
                required
                {...form.getInputProps("hrContactName")}
              />
              <TextInput
                label="Surname"
                placeholder="Smith"
                required
                {...form.getInputProps("hrContactSurname")}
              />
            </Group>
            <Group grow>
              <TextInput
                label="Phone"
                placeholder="+27..."
                required
                {...form.getInputProps("hrContactPhoneNumber")}
              />
              <TextInput
                label="Email"
                placeholder="jane@acme.com"
                required
                {...form.getInputProps("hrContactEmail")}
              />
            </Group>

            <Divider my="xs" label="Modules" labelPosition="left" />
            <MultiSelect
              label="Active Modules"
              placeholder="Select modules"
              data={moduleOptions}
              {...form.getInputProps("modules")}
            />

            <Button
              type="submit"
              fullWidth
              mt="sm"
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {editingId ? "Update" : "Create"}
            </Button>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}
