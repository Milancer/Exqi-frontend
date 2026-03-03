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
  PasswordInput,
  Select,
  Badge,
  ActionIcon,
  Loader,
  Center,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconPlus, IconEdit, IconTrash, IconUsers } from "@tabler/icons-react";
import { useUrlFilters } from "../hooks/useUrlFilters";
import type { User } from "../services/users/interfaces";
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
} from "../services/users/hooks";
import { useClients } from "../services/clients/hooks";

const roleOptions = [
  { value: "ADMIN", label: "Admin" },
  { value: "OFFICE_MANAGER", label: "Office Manager" },
  { value: "OFFICE_USER", label: "Office User" },
];

const statusOptions = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
];

const roleColor: Record<string, string> = {
  ADMIN: "red",
  OFFICE_MANAGER: "blue",
  OFFICE_USER: "gray",
};

export default function Users() {
  const { data: users = [], isLoading: loading } = useUsers();
  const { data: clients = [] } = useClients();
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();

  const [modalOpened, setModalOpened] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // URL-persisted filters
  const f = useUrlFilters(["search", "role", "status", "client"] as const);

  const form = useForm({
    initialValues: {
      name: "",
      surname: "",
      idNumber: "",
      phoneNumber: "",
      email: "",
      password: "",
      role: "OFFICE_USER",
      status: "ACTIVE",
      clientId: "",
    },
    validate: {
      name: (v) => (v.trim() ? null : "Name is required"),
      surname: (v) => (v.trim() ? null : "Surname is required"),
      email: (v) => (/^\S+@\S+$/.test(v) ? null : "Invalid email"),
      password: (v, _values) => {
        if (editingId) return null; // password optional on edit
        return v.length >= 6 ? null : "Min 6 characters";
      },
      clientId: (v) => (v ? null : "Client is required"),
    },
  });

  const openCreate = () => {
    form.reset();
    setEditingId(null);
    setModalOpened(true);
  };

  const openEdit = (u: User) => {
    form.setValues({
      name: u.name,
      surname: u.surname,
      idNumber: u.idNumber || "",
      phoneNumber: u.phoneNumber || "",
      email: u.email,
      password: "",
      role: u.role,
      status: u.status,
      clientId: u.clientId.toString(),
    });
    setEditingId(u.id);
    setModalOpened(true);
  };

  const handleSubmit = async (values: typeof form.values) => {
    try {
      const payload: any = {
        ...values,
        clientId: Number(values.clientId),
      };
      if (editingId && !payload.password) {
        delete payload.password;
      }
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: payload });
        notifications.show({
          title: "Updated",
          message: "User updated",
          color: "green",
        });
      } else {
        await createMutation.mutateAsync(payload);
        notifications.show({
          title: "Created",
          message: "User created",
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
        message: "User removed",
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

  const clientOptions = clients.map((c) => ({
    value: c.id.toString(),
    label: c.name,
  }));

  // Filtered rows
  const filtered = useMemo(() => {
    const search = f.get("search")?.toLowerCase();
    const role = f.get("role");
    const status = f.get("status");
    const client = f.get("client");
    return users.filter((u) => {
      if (
        search &&
        !(
          `${u.name} ${u.surname}`.toLowerCase().includes(search) ||
          u.email.toLowerCase().includes(search)
        )
      )
        return false;
      if (role && u.role !== role) return false;
      if (status && u.status !== status) return false;
      if (client && u.clientId.toString() !== client) return false;
      return true;
    });
  }, [users, f]);

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-end">
        <Box>
          <Title order={2} fw={800}>
            Users
          </Title>
          <Text size="sm" c="dimmed">
            Manage user accounts, roles, and client assignments
          </Text>
        </Box>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={openCreate}
          variant="gradient"
          gradient={{ from: "indigo", to: "violet", deg: 135 }}
          size="sm"
        >
          Add User
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
            placeholder="Search name or email…"
            value={f.get("search") || ""}
            onChange={(e) => f.set("search", e.currentTarget.value || null)}
            style={{ flex: 1, maxWidth: 240 }}
          />
          <Select
            placeholder="All Roles"
            data={roleOptions}
            value={f.get("role")}
            onChange={(v) => f.set("role", v)}
            clearable
            w={160}
          />
          <Select
            placeholder="All Statuses"
            data={statusOptions}
            value={f.get("status")}
            onChange={(v) => f.set("status", v)}
            clearable
            w={140}
          />
          <Select
            placeholder="All Clients"
            data={clientOptions}
            value={f.get("client")}
            onChange={(v) => f.set("client", v)}
            clearable
            searchable
            w={180}
          />
          <Badge variant="light" color="gray" size="lg">
            {filtered.length} / {users.length}
          </Badge>
        </Group>
        {loading ? (
          <Center p="xl">
            <Loader />
          </Center>
        ) : filtered.length === 0 ? (
          <Center p="xl">
            <Stack align="center" gap="xs">
              <IconUsers size={48} style={{ opacity: 0.3 }} />
              <Text c="dimmed">
                {users.length === 0 ? "No users yet" : "No users match filters"}
              </Text>
              {users.length === 0 && (
                <Button size="xs" variant="light" onClick={openCreate}>
                  Add first user
                </Button>
              )}
            </Stack>
          </Center>
        ) : (
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th>Role</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Client</Table.Th>
                <Table.Th style={{ width: 100 }}>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filtered.map((u) => (
                <Table.Tr key={u.id}>
                  <Table.Td fw={500}>
                    {u.name} {u.surname}
                  </Table.Td>
                  <Table.Td>{u.email}</Table.Td>
                  <Table.Td>
                    <Badge
                      size="sm"
                      variant="light"
                      color={roleColor[u.role] || "gray"}
                    >
                      {u.role.replace("_", " ")}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      size="sm"
                      variant="dot"
                      color={u.status === "ACTIVE" ? "green" : "gray"}
                    >
                      {u.status}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{u.client?.name || `#${u.clientId}`}</Table.Td>
                  <Table.Td>
                    <Group gap={4}>
                      <ActionIcon
                        variant="subtle"
                        color="blue"
                        onClick={() => openEdit(u)}
                      >
                        <IconEdit size={16} />
                      </ActionIcon>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        onClick={() => handleDelete(u.id)}
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
        title={editingId ? "Edit User" : "New User"}
        size="lg"
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <Group grow>
              <TextInput
                label="Name"
                placeholder="First name"
                required
                {...form.getInputProps("name")}
              />
              <TextInput
                label="Surname"
                placeholder="Last name"
                required
                {...form.getInputProps("surname")}
              />
            </Group>
            <Group grow>
              <TextInput
                label="ID Number"
                placeholder="National ID"
                {...form.getInputProps("idNumber")}
              />
              <TextInput
                label="Phone"
                placeholder="+27..."
                {...form.getInputProps("phoneNumber")}
              />
            </Group>
            <TextInput
              label="Email"
              placeholder="user@company.com"
              required
              {...form.getInputProps("email")}
            />
            <PasswordInput
              label={editingId ? "Password (leave blank to keep)" : "Password"}
              placeholder="Min 6 characters"
              required={!editingId}
              {...form.getInputProps("password")}
            />
            <Group grow>
              <Select
                label="Role"
                data={roleOptions}
                required
                {...form.getInputProps("role")}
              />
              <Select
                label="Status"
                data={statusOptions}
                {...form.getInputProps("status")}
              />
            </Group>
            <Select
              label="Client"
              placeholder="Select client"
              data={clientOptions}
              required
              searchable
              {...form.getInputProps("clientId")}
            />
            <Button type="submit" fullWidth>
              {editingId ? "Update" : "Create"}
            </Button>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}
