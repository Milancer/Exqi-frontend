import { useState, useMemo } from "react";
import {
  Title,
  Button,
  Modal,
  TextInput,
  Textarea,
  Group,
  Stack,
  Text,
  Badge,
  Box,
  ActionIcon,
  Select,
  NumberInput,
  Table,
  Tooltip,
  Loader,
  Paper,
  Divider,
  Accordion,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import {
  IconPlus,
  IconTemplate,
  IconEdit,
  IconTrash,
  IconX,
  IconEye,
  IconDownload,
} from "@tabler/icons-react";
import { useUrlFilters } from "../hooks/useUrlFilters";
import type {
  CbiTemplate,
  CompetencySelection,
} from "../services/cbi/interfaces";
import {
  useCbiTemplates,
  useCreateTemplate,
  useUpdateTemplate,
  useDeleteTemplate,
} from "../services/cbi/hooks";
import {
  useCompetencies,
  useCompetencyQuestions,
} from "../services/competencies/hooks";
import { useClients } from "../services/clients/hooks";
import { useAuth } from "../contexts/AuthContext";
import { downloadCbiTemplatePdf } from "../components/CbiTemplatePdf";

const levelColors: Record<number, string> = {
  1: "green",
  2: "teal",
  3: "blue",
  4: "violet",
  5: "red",
};

/* ─── Main Page ─── */
export default function CbiTemplates() {
  const { user } = useAuth();
  const { data: clients = [] } = useClients();
  const clientLogo = clients.find((c) => c.id === user?.clientId)?.logo || null;
  const { data: templates = [], isLoading: loading } = useCbiTemplates();
  const { data: competencies = [] } = useCompetencies();
  const { data: allQuestions = [] } = useCompetencyQuestions();
  const createMutation = useCreateTemplate();
  const updateMutation = useUpdateTemplate();
  const deleteMutation = useDeleteTemplate();

  // Modal state
  const [modalOpened, setModalOpened] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Preview state
  const [previewTemplate, setPreviewTemplate] = useState<CbiTemplate | null>(
    null,
  );
  const [previewOpened, setPreviewOpened] = useState(false);

  // URL-persisted filters
  const f = useUrlFilters(["search"] as const);

  // Competency selections for the current template being created/edited
  const [selections, setSelections] = useState<CompetencySelection[]>([]);
  const [addCompId, setAddCompId] = useState<string | null>(null);
  const [addLevel, setAddLevel] = useState<number>(3);

  const form = useForm({
    initialValues: {
      template_name: "",
      description: "",
    },
  });

  /* ─── Helpers ─── */
  const compName = (id: number) =>
    competencies.find((c) => c.competency_id === id)?.competency || `#${id}`;

  const compOptions = competencies
    .filter((c) => !selections.some((s) => s.competency_id === c.competency_id))
    .map((c) => ({
      value: c.competency_id.toString(),
      label: c.competency,
    }));

  const addSelection = () => {
    if (!addCompId) return;
    setSelections((prev) => [
      ...prev,
      { competency_id: parseInt(addCompId), level: addLevel },
    ]);
    setAddCompId(null);
    setAddLevel(3);
  };

  const removeSelection = (compId: number) => {
    setSelections((prev) => prev.filter((s) => s.competency_id !== compId));
  };

  /* ─── CRUD ─── */
  const openCreate = () => {
    form.reset();
    setEditingId(null);
    setSelections([]);
    setModalOpened(true);
  };

  const openEdit = (template: CbiTemplate) => {
    form.setValues({
      template_name: template.template_name,
      description: template.description || "",
    });
    setEditingId(template.cbi_template_id);
    setSelections(template.competencies || []);
    setModalOpened(true);
  };

  const handleSubmit = async (values: typeof form.values) => {
    try {
      const payload = {
        ...values,
        competencies: selections,
      };

      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: payload });
        notifications.show({
          title: "Updated",
          message: "Template updated",
          color: "green",
        });
      } else {
        await createMutation.mutateAsync(payload);
        notifications.show({
          title: "Created",
          message: "Template created",
          color: "green",
        });
      }

      setModalOpened(false);
      form.reset();
      setEditingId(null);
      setSelections([]);
    } catch (error: any) {
      notifications.show({
        title: "Error",
        message: error.response?.data?.message || "Operation failed",
        color: "red",
      });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
      notifications.show({
        title: "Deleted",
        message: "Template deleted",
        color: "green",
      });
    } catch (error: any) {
      notifications.show({
        title: "Error",
        message: error.response?.data?.message || "Delete failed",
        color: "red",
      });
    }
  };

  // Dynamic question count for a template
  const dynamicQuestionCount = (template: CbiTemplate) => {
    if (!template.competencies || template.competencies.length === 0) return 0;
    return template.competencies.reduce((total, sel) => {
      return (
        total +
        allQuestions.filter(
          (q) =>
            q.competency_id === sel.competency_id &&
            q.level === sel.level &&
            q.status === "Active",
        ).length
      );
    }, 0);
  };

  const openPreview = (template: CbiTemplate) => {
    setPreviewTemplate(template);
    setPreviewOpened(true);
  };

  /* ─── Build preview data ─── */
  const buildPreviewData = (template: CbiTemplate) => {
    if (!template.competencies || template.competencies.length === 0) return [];

    return template.competencies.map((sel) => {
      const comp = competencies.find(
        (c) => c.competency_id === sel.competency_id,
      );
      const questionsForLevel = allQuestions.filter(
        (q) =>
          q.competency_id === sel.competency_id &&
          q.level === sel.level &&
          q.status === "Active",
      );
      return {
        competency_id: sel.competency_id,
        competency_name: comp?.competency || `#${sel.competency_id}`,
        level: sel.level,
        questions: questionsForLevel,
      };
    });
  };

  // Filtered templates
  const filtered = useMemo(() => {
    const search = f.get("search")?.toLowerCase();
    if (!search) return templates;
    return templates.filter(
      (t) =>
        t.template_name.toLowerCase().includes(search) ||
        (t.description && t.description.toLowerCase().includes(search)),
    );
  }, [templates, f]);

  /* ─── Render ─── */
  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Box>
          <Title order={2} fw={800}>
            CBI Templates
          </Title>
          <Text size="sm" c="dimmed">
            Build structured competency-based interview templates
          </Text>
        </Box>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={openCreate}
          variant="gradient"
          gradient={{ from: "orange", to: "pink", deg: 135 }}
        >
          Create Template
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
            placeholder="Search templates…"
            value={f.get("search") || ""}
            onChange={(e) => f.set("search", e.currentTarget.value || null)}
            style={{ flex: 1, maxWidth: 280 }}
          />
          <Badge variant="light" color="gray" size="lg">
            {filtered.length} / {templates.length}
          </Badge>
        </Group>
        {loading ? (
          <Box p="xl" ta="center">
            <Loader size="sm" />
          </Box>
        ) : filtered.length === 0 ? (
          <Stack align="center" gap="md" p={60}>
            <IconTemplate
              size={48}
              stroke={1}
              style={{ color: "var(--mantine-color-dimmed)" }}
            />
            <Text c="dimmed" size="lg">
              {templates.length === 0
                ? "No templates yet"
                : "No templates match search"}
            </Text>
            {templates.length === 0 && (
              <Button variant="light" onClick={openCreate}>
                Create your first template
              </Button>
            )}
          </Stack>
        ) : (
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Template</Table.Th>
                <Table.Th>Competencies</Table.Th>
                <Table.Th w={100}>Questions</Table.Th>
                <Table.Th w={120}>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filtered.map((template) => (
                <Table.Tr key={template.cbi_template_id}>
                  <Table.Td>
                    <Text size="sm" fw={500}>
                      {template.template_name}
                    </Text>
                    {template.description && (
                      <Text size="xs" c="dimmed" lineClamp={1}>
                        {template.description}
                      </Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4} wrap="wrap">
                      {template.competencies &&
                      template.competencies.length > 0 ? (
                        template.competencies.map((sel) => (
                          <Badge
                            key={sel.competency_id}
                            size="xs"
                            variant="light"
                            color={levelColors[sel.level] || "gray"}
                          >
                            {compName(sel.competency_id)} L{sel.level}
                          </Badge>
                        ))
                      ) : (
                        <Text size="xs" c="dimmed">
                          None
                        </Text>
                      )}
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Badge variant="light" color="teal" size="sm">
                      {dynamicQuestionCount(template)}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4} wrap="nowrap">
                      <Tooltip label="Preview Questions">
                        <ActionIcon
                          variant="subtle"
                          color="teal"
                          onClick={() => openPreview(template)}
                        >
                          <IconEye size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Download PDF">
                        <ActionIcon
                          variant="subtle"
                          color="grape"
                          onClick={() =>
                            downloadCbiTemplatePdf(
                              template,
                              competencies,
                              allQuestions,
                              clientLogo,
                            )
                          }
                        >
                          <IconDownload size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Edit">
                        <ActionIcon
                          variant="subtle"
                          color="blue"
                          onClick={() => openEdit(template)}
                        >
                          <IconEdit size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Delete">
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          onClick={() => handleDelete(template.cbi_template_id)}
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

      {/* ─── Create/Edit Modal ─── */}
      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        title={editingId ? "Edit Template" : "Create CBI Template"}
        size="lg"
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput
              label="Template Name"
              placeholder="e.g., Senior Developer Interview"
              required
              {...form.getInputProps("template_name")}
            />
            <Textarea
              label="Description"
              placeholder="Describe this template"
              minRows={2}
              {...form.getInputProps("description")}
            />

            <Divider
              label="Competency Selections"
              labelPosition="left"
              mt="xs"
            />

            {/* Current selections */}
            {selections.length > 0 && (
              <Paper withBorder p="sm" radius="md">
                <Stack gap="xs">
                  {selections.map((sel) => (
                    <Group key={sel.competency_id} justify="space-between">
                      <Group gap="xs">
                        <Text size="sm" fw={500}>
                          {compName(sel.competency_id)}
                        </Text>
                        <Badge
                          size="sm"
                          variant="filled"
                          color={levelColors[sel.level] || "gray"}
                        >
                          Level {sel.level}
                        </Badge>
                      </Group>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        size="sm"
                        onClick={() => removeSelection(sel.competency_id)}
                      >
                        <IconX size={14} />
                      </ActionIcon>
                    </Group>
                  ))}
                </Stack>
              </Paper>
            )}

            {selections.length === 0 && (
              <Text size="sm" c="dimmed" ta="center">
                No competencies added yet
              </Text>
            )}

            {/* Add competency row */}
            <Group gap="xs" align="end">
              <Select
                label="Competency"
                placeholder="Select competency"
                data={compOptions}
                value={addCompId}
                onChange={setAddCompId}
                searchable
                style={{ flex: 1 }}
                size="sm"
              />
              <NumberInput
                label="Level"
                min={1}
                max={5}
                value={addLevel}
                onChange={(v) => setAddLevel(typeof v === "number" ? v : 3)}
                w={80}
                size="sm"
              />
              <Button
                size="sm"
                variant="light"
                color="indigo"
                onClick={addSelection}
                disabled={!addCompId}
                leftSection={<IconPlus size={14} />}
              >
                Add
              </Button>
            </Group>

            <Button
              type="submit"
              fullWidth
              variant="gradient"
              gradient={{ from: "orange", to: "pink", deg: 135 }}
              mt="sm"
            >
              {editingId ? "Update Template" : "Create Template"}
            </Button>
          </Stack>
        </form>
      </Modal>

      {/* ─── Question Preview Modal ─── */}
      <Modal
        opened={previewOpened}
        onClose={() => setPreviewOpened(false)}
        title={
          previewTemplate
            ? `Questions — ${previewTemplate.template_name}`
            : "Question Preview"
        }
        size="xl"
      >
        {previewTemplate && (
          <>
            {(!previewTemplate.competencies ||
              previewTemplate.competencies.length === 0) && (
              <Text c="dimmed" ta="center" py="lg">
                No competencies linked to this template. Edit the template to
                add competencies first.
              </Text>
            )}

            {previewTemplate.competencies &&
              previewTemplate.competencies.length > 0 && (
                <Accordion variant="separated" radius="md" multiple>
                  {buildPreviewData(previewTemplate).map((group) => (
                    <Accordion.Item
                      key={`${group.competency_id}-${group.level}`}
                      value={`${group.competency_id}-${group.level}`}
                    >
                      <Accordion.Control>
                        <Group gap="sm">
                          <Text fw={500}>{group.competency_name}</Text>
                          <Badge
                            size="sm"
                            variant="filled"
                            color={levelColors[group.level] || "gray"}
                          >
                            Level {group.level}
                          </Badge>
                          <Badge size="xs" variant="light" color="gray">
                            {group.questions.length} question
                            {group.questions.length !== 1 ? "s" : ""}
                          </Badge>
                        </Group>
                      </Accordion.Control>
                      <Accordion.Panel>
                        {group.questions.length === 0 ? (
                          <Text size="sm" c="dimmed">
                            No active questions for this competency at level{" "}
                            {group.level}. Add questions in the Competencies
                            section.
                          </Text>
                        ) : (
                          <Table>
                            <Table.Tbody>
                              {group.questions.map((q) => (
                                <Table.Tr key={q.competency_question_id}>
                                  <Table.Td>
                                    <Text size="sm">{q.question}</Text>
                                  </Table.Td>
                                </Table.Tr>
                              ))}
                            </Table.Tbody>
                          </Table>
                        )}
                      </Accordion.Panel>
                    </Accordion.Item>
                  ))}
                </Accordion>
              )}
          </>
        )}
      </Modal>
    </Stack>
  );
}
