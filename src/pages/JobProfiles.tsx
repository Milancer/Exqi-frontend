import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Title,
  Button,
  Table,
  Modal,
  TextInput,
  Textarea,
  Group,
  ActionIcon,
  Badge,
  Stack,
  Paper,
  Text,
  Box,
  Tooltip,
  Tabs,
  NumberInput,
  Switch,
  Select,
  Loader,
  Center,
  Pagination,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconBriefcase,
  IconTargetArrow,
  IconTool,
  IconChecklist,
  IconSchool,
  IconFileDescription,
  IconShieldCheck,
  IconEye,
} from "@tabler/icons-react";
import JobProfilePreview from "../components/JobProfilePreview";
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { useClients } from "../services/clients/hooks";
import { useUrlFilters } from "../hooks/useUrlFilters";
import type {
  JobProfile,
  JpCompetency,
  JPReviewer,
} from "../services/job-profiles/interfaces";

const statusColors: Record<string, string> = {
  "In Progress": "blue",
  "Awaiting Review": "orange",
  "Awaiting Approval": "yellow",
  Approved: "teal",
  Deleted: "red",
};

export default function JobProfiles() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: clients = [] } = useClients();
  const clientLogo = clients.find((c) => c.id === user?.clientId)?.logo || null;
  const isAdmin = user?.role === "ADMIN";
  const [profiles, setProfiles] = useState<JobProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpened, setModalOpened] = useState(false);

  // Preview modal state
  const [previewOpened, setPreviewOpened] = useState(false);
  const [previewProfile, setPreviewProfile] = useState<JobProfile | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // URL-persisted filters
  const f = useUrlFilters(["search", "jpStatus", "division", "page"] as const);

  // Pagination state
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const currentPage = parseInt(f.get("page") || "1", 10);
  const limit = 20;

  // Debounced search for server-side query
  const [debouncedSearch] = useDebouncedValue(f.get("search") || "", 300);

  // Division options fetched from server
  const [divisionOptions, setDivisionOptions] = useState<{ value: string; label: string }[]>([]);

  // Reference data for dropdowns
  const [departments, setDepartments] = useState<{ value: string; label: string }[]>([]);
  const [jobGrades, setJobGrades] = useState<{ value: string; label: string }[]>([]);
  const [workLevels, setWorkLevels] = useState<{ value: string; label: string }[]>([]);

  /* Reference data for competency picker in create modal */
  const [allCompetencies, setAllCompetencies] = useState<JpCompetency[]>([]);

  /* create-modal item state */
  const [createCompSelections, setCreateCompSelections] = useState<{
    [key: number]: {
      level: number;
      is_critical: boolean;
      is_differentiating: boolean;
    };
  }>({});
  const [createSkills, setCreateSkills] = useState<
    { skill_name: string; level: number; is_critical: boolean }[]
  >([]);
  const [createSkillDraft, setCreateSkillDraft] = useState("");
  const [createSkillLevelDraft, setCreateSkillLevelDraft] = useState(3);
  const [createSkillCritDraft, setCreateSkillCritDraft] = useState(false);
  const [createDeliverables, setCreateDeliverables] = useState<string[]>([]);
  const [createDelDraft, setCreateDelDraft] = useState("");
  const [createReqs, setCreateReqs] = useState({
    education: "",
    experience: "",
    certifications: "",
    other_requirements: "",
  });

  // Reviewer & approver candidates
  const [reviewerCandidates, setReviewerCandidates] = useState<JPReviewer[]>(
    [],
  );
  const [approverCandidates, setApproverCandidates] = useState<JPReviewer[]>(
    [],
  );
  const [createReviewerId, setCreateReviewerId] = useState<string | null>(null);
  const [createApproverId, setCreateApproverId] = useState<string | null>(null);

  /* forms */
  const descForm = useForm({
    initialValues: {
      job_title: "",
      job_purpose: "",
      division: "",
      level_of_work: "" as string | number,
      reports_to: "" as string | number,
      department_id: "" as string | number,
      job_grade_id: "" as string | number,
      status: "In Progress",
    },
    validate: {
      job_title: (v) => (v.trim() ? null : "Job title is required"),
      job_purpose: (v) => (v.trim() ? null : "Job purpose is required"),
    },
  });

  // Extract filter values for stable dependencies
  const statusFilter = f.get("jpStatus") || "";
  const divisionFilter = f.get("division") || "";

  /* ─── Fetchers ─── */
  const fetchProfiles = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("page", String(currentPage));
      params.set("limit", String(limit));
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (statusFilter) params.set("status", statusFilter);
      if (divisionFilter) params.set("division", divisionFilter);

      const res = await api.get(`/job-profiles?${params.toString()}`);
      setProfiles(res.data.data);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to fetch job profiles",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch, statusFilter, divisionFilter]);

  const fetchDivisions = useCallback(async () => {
    try {
      const res = await api.get("/job-profiles/divisions");
      setDivisionOptions(res.data.map((d: string) => ({ value: d, label: d })));
    } catch {
      /* silent */
    }
  }, []);

  const fetchCompetencies = useCallback(async () => {
    try {
      const res = await api.get("/job-profiles/competency-items");
      setAllCompetencies(res.data);
    } catch {
      /* silent */
    }
  }, []);

  const fetchReferenceData = useCallback(async () => {
    api
      .get("/departments")
      .then((res) =>
        setDepartments(
          (res.data || []).map((d: any) => ({
            value: String(d.department_id),
            label: d.department,
          })),
        ),
      )
      .catch(() => {});
    api
      .get("/job-grades")
      .then((res) =>
        setJobGrades(
          (res.data || []).map((g: any) => ({
            value: String(g.job_grade_id),
            label: g.job_grade,
          })),
        ),
      )
      .catch(() => {});
    api
      .get("/work-levels")
      .then((res) =>
        setWorkLevels(
          (res.data || []).map((w: any) => ({
            value: String(w.work_level_id),
            label: w.level_of_work,
          })),
        ),
      )
      .catch(() => {});
  }, []);

  const fetchReviewerCandidates = useCallback(async () => {
    try {
      const [revRes, appRes] = await Promise.all([
        api.get("/job-profiles/reviewer-candidates"),
        api.get("/job-profiles/approver-candidates"),
      ]);
      setReviewerCandidates(revRes.data);
      setApproverCandidates(appRes.data);
    } catch {
      /* silent */
    }
  }, []);

  // Fetch profiles when filters or pagination change
  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  // Fetch reference data once on mount
  useEffect(() => {
    fetchDivisions();
    fetchCompetencies();
    fetchReferenceData();
    fetchReviewerCandidates();
  }, [fetchDivisions, fetchCompetencies, fetchReferenceData, fetchReviewerCandidates]);

  // Reset to page 1 when search or filters change
  const prevSearch = useRef(debouncedSearch);
  const prevStatus = useRef(statusFilter);
  const prevDivision = useRef(divisionFilter);
  useEffect(() => {
    const searchChanged = prevSearch.current !== debouncedSearch;
    const statusChanged = prevStatus.current !== statusFilter;
    const divisionChanged = prevDivision.current !== divisionFilter;
    if ((searchChanged || statusChanged || divisionChanged) && currentPage !== 1) {
      f.set("page", "1");
    }
    prevSearch.current = debouncedSearch;
    prevStatus.current = statusFilter;
    prevDivision.current = divisionFilter;
  }, [debouncedSearch, statusFilter, divisionFilter, currentPage, f]);

  /* ─── Handlers ─── */
  const openCreate = () => {
    descForm.reset();
    setModalOpened(true);
  };

  const handleSubmit = async (values: typeof descForm.values) => {
    try {
      const payload: any = {
        ...values,
        level_of_work: values.level_of_work
          ? Number(values.level_of_work)
          : null,
        reports_to: values.reports_to ? Number(values.reports_to) : null,
        department_id: values.department_id
          ? Number(values.department_id)
          : null,
        job_grade_id: values.job_grade_id ? Number(values.job_grade_id) : null,
      };

      const res = await api.post("/job-profiles", payload);
      const newId = res.data.job_profile_id;

      // Batch-add competencies
      const compEntries = Object.entries(createCompSelections);
      for (const [compId, sel] of compEntries) {
        try {
          await api.post(`/job-profiles/${newId}/competencies`, {
            jp_competency_id: Number(compId),
            level: sel.level,
            is_critical: sel.is_critical,
            is_differentiating: sel.is_differentiating,
          });
        } catch {
          /* skip individual failures */
        }
      }

      // Batch-add skills
      for (const skill of createSkills) {
        try {
          await api.post(`/job-profiles/${newId}/skills`, skill);
        } catch {
          /* skip individual failures */
        }
      }

      // Batch-add deliverables
      for (let i = 0; i < createDeliverables.length; i++) {
        try {
          await api.post(`/job-profiles/${newId}/deliverables`, {
            deliverable_text: createDeliverables[i],
            sequence: i + 1,
          });
        } catch {
          /* skip individual failures */
        }
      }

      // Save requirements
      const hasReqs =
        createReqs.education ||
        createReqs.experience ||
        createReqs.certifications ||
        createReqs.other_requirements;
      if (hasReqs) {
        try {
          await api.patch(`/job-profiles/${newId}/requirements`, createReqs);
        } catch {
          /* skip if fails */
        }
      }

      // Submit for review if both reviewer and approver selected
      if (createReviewerId && createApproverId) {
        try {
          await api.post(`/job-profiles/${newId}/submit-for-review`, {
            reviewer_id: Number(createReviewerId),
            approver_id: Number(createApproverId),
          });
        } catch {
          /* skip if fails */
        }
      }

      const addedCount =
        compEntries.length +
        createSkills.length +
        createDeliverables.length +
        (hasReqs ? 1 : 0);
      notifications.show({
        title: "Created",
        message: `Job profile created${addedCount > 0 ? ` with ${addedCount} linked item(s)` : ""}`,
        color: "green",
      });

      // Reset create-modal state
      setCreateCompSelections({});
      setCreateSkills([]);
      setCreateDeliverables([]);
      setCreateReqs({
        education: "",
        experience: "",
        certifications: "",
        other_requirements: "",
      });
      setCreateReviewerId(null);
      setCreateApproverId(null);
      setModalOpened(false);
      descForm.reset();

      // Stay on the list → refresh data
      fetchProfiles();
    } catch (e: any) {
      notifications.show({
        title: "Error",
        message: e.response?.data?.message || "Operation failed",
        color: "red",
      });
    }
  };

  const handleViewProfile = async (id: number) => {
    setLoadingPreview(true);
    try {
      const res = await api.get(`/job-profiles/${id}`);
      setPreviewProfile(res.data);
      setPreviewOpened(true);
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to load job profile",
        color: "red",
      });
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this job profile?")) return;
    try {
      await api.delete(`/job-profiles/${id}`);
      notifications.show({
        title: "Deleted",
        message: "Job profile deleted",
        color: "green",
      });
      fetchProfiles();
    } catch (e: any) {
      notifications.show({
        title: "Error",
        message: e.response?.data?.message || "Delete failed",
        color: "red",
      });
    }
  };

  /* ───────── LIST VIEW ───────── */
  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Box>
          <Title order={2} fw={800}>
            Job Profiles
          </Title>
          <Text size="sm" c="dimmed">
            Create and manage job profiles with competency mapping
          </Text>
        </Box>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={openCreate}
          variant="gradient"
          gradient={{ from: "grape", to: "violet", deg: 135 }}
        >
          Create Job Profile
        </Button>
      </Group>

      {/* Filters */}
      <Paper
        withBorder
        p="sm"
        style={{ border: "1px solid var(--mantine-color-default-border)" }}
      >
        <Group>
          <TextInput
            placeholder="Search by title…"
            value={f.get("search") || ""}
            onChange={(e) => f.set("search", e.currentTarget.value || null)}
            style={{ flex: 1 }}
            size="sm"
          />
          <Select
            placeholder="Status"
            data={[
              { value: "In Progress", label: "In Progress" },
              { value: "Awaiting Review", label: "Awaiting Review" },
              { value: "Awaiting Approval", label: "Awaiting Approval" },
              { value: "Approved", label: "Approved" },
            ]}
            value={f.get("jpStatus") || null}
            onChange={(v) => f.set("jpStatus", v)}
            clearable
            size="sm"
            w={150}
          />
          <Select
            placeholder="Division"
            data={divisionOptions}
            value={f.get("division") || null}
            onChange={(v) => f.set("division", v)}
            clearable
            size="sm"
            w={160}
          />
          <Badge variant="light" color="gray" size="lg">
            {profiles.length} / {total}
          </Badge>
        </Group>
      </Paper>

      {/* Table */}
      <Paper
        withBorder
        p="md"
        style={{ border: "1px solid var(--mantine-color-default-border)" }}
      >
        {loading ? (
          <Center p="xl">
            <Loader />
          </Center>
        ) : profiles.length === 0 ? (
          <Box p="xl" ta="center">
            <Stack align="center" gap="xs">
              <IconBriefcase
                size={40}
                stroke={1}
                style={{ color: "var(--mantine-color-dimmed)" }}
              />
              <Text size="sm" c="dimmed">
                No job profiles found
              </Text>
              <Button
                size="xs"
                variant="light"
                onClick={openCreate}
                leftSection={<IconPlus size={14} />}
              >
                Create one
              </Button>
            </Stack>
          </Box>
        ) : (
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Title</Table.Th>
                <Table.Th>Division</Table.Th>
                <Table.Th>Department</Table.Th>
                {isAdmin && <Table.Th>Client</Table.Th>}
                <Table.Th>Status</Table.Th>
                <Table.Th w={120}>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {profiles.map((p) => (
                <Table.Tr key={p.job_profile_id}>
                  <Table.Td>
                    <Text
                      fw={500}
                      style={{ cursor: "pointer" }}
                      onClick={() =>
                        navigate(`/job-profiles/${p.job_profile_id}`)
                      }
                      c="blue"
                    >
                      {p.job_title}
                    </Text>
                  </Table.Td>
                  <Table.Td>{p.division || "—"}</Table.Td>
                  <Table.Td>{(p as any).department?.department || "—"}</Table.Td>
                  {isAdmin && (
                    <Table.Td>{p.client?.name || "—"}</Table.Td>
                  )}
                  <Table.Td>
                    <Badge
                      variant="light"
                      color={statusColors[p.status] || "gray"}
                    >
                      {p.status}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4} wrap="nowrap">
                      <Tooltip label="Preview & Download">
                        <ActionIcon
                          variant="subtle"
                          color="teal"
                          onClick={() => handleViewProfile(p.job_profile_id)}
                          loading={loadingPreview}
                        >
                          <IconEye size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Edit">
                        <ActionIcon
                          variant="subtle"
                          color="blue"
                          onClick={() =>
                            navigate(`/job-profiles/${p.job_profile_id}`)
                          }
                        >
                          <IconEdit size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Delete">
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          onClick={() => handleDelete(p.job_profile_id)}
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

        {/* Pagination */}
        {totalPages > 1 && (
          <Group justify="center" mt="md">
            <Pagination
              total={totalPages}
              value={currentPage}
              onChange={(page) => f.set("page", String(page))}
              size="sm"
            />
            <Text size="xs" c="dimmed">
              Page {currentPage} of {totalPages} ({total} total)
            </Text>
          </Group>
        )}
      </Paper>

      {/* ─── Create Modal (Tabbed) ─── */}
      <Modal
        opened={modalOpened}
        onClose={() => {
          setModalOpened(false);
          setCreateCompSelections({});
          setCreateSkills([]);
          setCreateDeliverables([]);
          setCreateReqs({
            education: "",
            experience: "",
            certifications: "",
            other_requirements: "",
          });
          setCreateReviewerId(null);
          setCreateApproverId(null);
        }}
        title="Create Job Profile"
        size="xl"
        styles={{ body: { maxHeight: "70vh", overflowY: "auto" } }}
      >
        <Tabs defaultValue="description">
          <Tabs.List mb="md">
            <Tabs.Tab
              value="description"
              leftSection={<IconFileDescription size={14} />}
            >
              Description *
            </Tabs.Tab>
            <Tabs.Tab
              value="requirements"
              leftSection={<IconSchool size={14} />}
            >
              Requirements
            </Tabs.Tab>
            <Tabs.Tab
              value="competencies"
              leftSection={<IconTargetArrow size={14} />}
            >
              Competencies
              {Object.values(createCompSelections).filter(Boolean).length >
                0 && (
                <Badge size="xs" variant="light" color="indigo" ml={4}>
                  {Object.values(createCompSelections).filter(Boolean).length}
                </Badge>
              )}
            </Tabs.Tab>
            <Tabs.Tab value="skills" leftSection={<IconTool size={14} />}>
              Skills
              {createSkills.length > 0 && (
                <Badge size="xs" variant="light" color="teal" ml={4}>
                  {createSkills.length}
                </Badge>
              )}
            </Tabs.Tab>
            <Tabs.Tab
              value="deliverables"
              leftSection={<IconChecklist size={14} />}
            >
              Deliverables
              {createDeliverables.length > 0 && (
                <Badge size="xs" variant="light" color="orange" ml={4}>
                  {createDeliverables.length}
                </Badge>
              )}
            </Tabs.Tab>
            <Tabs.Tab
              value="approval"
              leftSection={<IconShieldCheck size={14} />}
            >
              Approval
            </Tabs.Tab>
          </Tabs.List>

          {/* Description Tab */}
          <Tabs.Panel value="description">
            <form onSubmit={descForm.onSubmit(handleSubmit)}>
              <Stack>
                <Group grow>
                  <TextInput
                    label="Job Title"
                    placeholder="e.g., Software Engineer"
                    required
                    {...descForm.getInputProps("job_title")}
                  />
                  <TextInput
                    label="Division"
                    placeholder="e.g., Engineering"
                    {...descForm.getInputProps("division")}
                  />
                </Group>
                <Textarea
                  label="Job Purpose"
                  placeholder="Describe the core purpose of this role"
                  required
                  minRows={3}
                  {...descForm.getInputProps("job_purpose")}
                />
                <Group grow>
                  <Select
                    label="Level of Work"
                    placeholder="Select level"
                    data={workLevels}
                    value={
                      descForm.values.level_of_work
                        ? String(descForm.values.level_of_work)
                        : null
                    }
                    onChange={(v) =>
                      descForm.setFieldValue("level_of_work", v ? Number(v) : "")
                    }
                    searchable
                    clearable
                  />
                  <Select
                    label="Reports To"
                    placeholder="Select manager profile"
                    data={profiles.map((p) => ({
                      value: String(p.job_profile_id),
                      label: p.job_title,
                    }))}
                    value={
                      descForm.values.reports_to
                        ? String(descForm.values.reports_to)
                        : null
                    }
                    onChange={(v) =>
                      descForm.setFieldValue("reports_to", v ? Number(v) : "")
                    }
                    searchable
                    clearable
                  />
                  <Select
                    label="Status"
                    data={[
                      { value: "In Progress", label: "In Progress" },
                      { value: "Awaiting Review", label: "Awaiting Review" },
                      { value: "Awaiting Approval", label: "Awaiting Approval" },
                      { value: "Approved", label: "Approved" },
                    ]}
                    {...descForm.getInputProps("status")}
                  />
                </Group>
                <Group grow>
                  <Select
                    label="Department"
                    placeholder="Select department"
                    data={departments}
                    value={
                      descForm.values.department_id
                        ? String(descForm.values.department_id)
                        : null
                    }
                    onChange={(v) =>
                      descForm.setFieldValue("department_id", v ? Number(v) : "")
                    }
                    searchable
                    clearable
                  />
                  <Select
                    label="Job Grade"
                    placeholder="Select job grade"
                    data={jobGrades}
                    value={
                      descForm.values.job_grade_id
                        ? String(descForm.values.job_grade_id)
                        : null
                    }
                    onChange={(v) =>
                      descForm.setFieldValue("job_grade_id", v ? Number(v) : "")
                    }
                    searchable
                    clearable
                  />
                </Group>
                <Button
                  type="submit"
                  fullWidth
                  variant="gradient"
                  gradient={{ from: "grape", to: "violet", deg: 135 }}
                >
                  Create Job Profile
                </Button>
              </Stack>
            </form>
          </Tabs.Panel>

          {/* Competencies Tab */}
          <Tabs.Panel value="competencies">
            <Stack>
              <Text size="sm" c="dimmed">
                Select competencies to link when the profile is created. Toggle
                on to include, then set level and flags.
              </Text>
              {allCompetencies.length === 0 ? (
                <Text c="dimmed" size="sm" ta="center" py="lg">
                  No competencies available. Add them in the Competency Table
                  first.
                </Text>
              ) : (
                (() => {
                  const types = new Map<
                    number,
                    { name: string; comps: JpCompetency[] }
                  >();
                  allCompetencies.forEach((c) => {
                    const typeId = c.jp_competency_type_id || 0;
                    const typeName =
                      c.competencyType?.competency_type || "Other";
                    if (!types.has(typeId))
                      types.set(typeId, { name: typeName, comps: [] });
                    types.get(typeId)!.comps.push(c);
                  });

                  return Array.from(types.entries()).map(
                    ([typeId, { name: typeName, comps }]) => {
                      const clusters = new Map<string, JpCompetency[]>();
                      comps.forEach((c) => {
                        const cn =
                          c.competencyCluster?.cluster_name || "Unclustered";
                        if (!clusters.has(cn)) clusters.set(cn, []);
                        clusters.get(cn)!.push(c);
                      });
                      const selectedCount = comps.filter(
                        (c) => createCompSelections[c.jp_competency_id],
                      ).length;

                      return (
                        <Paper
                          key={typeId}
                          withBorder
                          radius="md"
                          mb="sm"
                          style={{ overflow: "hidden" }}
                        >
                          <Box
                            p="xs"
                            style={{
                              background: "var(--mantine-color-indigo-6)",
                              color: "white",
                            }}
                          >
                            <Group justify="space-between">
                              <Text size="sm" fw={600}>
                                {typeName} Competencies
                              </Text>
                              <Badge
                                size="xs"
                                variant="filled"
                                color="rgba(255,255,255,0.2)"
                              >
                                {selectedCount} / {comps.length}
                              </Badge>
                            </Group>
                          </Box>
                          <Box p="xs">
                            {Array.from(clusters.entries()).map(
                              ([clusterName, clusterComps]) => (
                                <Box key={clusterName} mb="sm">
                                  <Text
                                    size="xs"
                                    fw={700}
                                    c="dimmed"
                                    tt="uppercase"
                                    mb={4}
                                  >
                                    {clusterName}
                                  </Text>
                                  {clusterComps.map((comp) => {
                                    const sel =
                                      createCompSelections[
                                        comp.jp_competency_id
                                      ];
                                    return (
                                      <Paper
                                        key={comp.jp_competency_id}
                                        withBorder
                                        p="xs"
                                        mb={4}
                                        radius="sm"
                                        style={{
                                          borderColor: sel
                                            ? "var(--mantine-color-indigo-4)"
                                            : undefined,
                                          background: sel
                                            ? "var(--mantine-color-indigo-0)"
                                            : undefined,
                                        }}
                                      >
                                        <Group
                                          wrap="nowrap"
                                          gap="xs"
                                          align="center"
                                        >
                                          <Switch
                                            size="xs"
                                            checked={!!sel}
                                            onChange={() => {
                                              setCreateCompSelections(
                                                (prev) => {
                                                  if (
                                                    prev[comp.jp_competency_id]
                                                  ) {
                                                    const next = { ...prev };
                                                    delete next[
                                                      comp.jp_competency_id
                                                    ];
                                                    return next;
                                                  }
                                                  return {
                                                    ...prev,
                                                    [comp.jp_competency_id]: {
                                                      level: 3,
                                                      is_critical: false,
                                                      is_differentiating: false,
                                                    },
                                                  };
                                                },
                                              );
                                            }}
                                          />
                                          <Box style={{ flex: 1, minWidth: 0 }}>
                                            <Text size="sm" fw={500}>
                                              {comp.competency}
                                            </Text>
                                            {comp.description && (
                                              <Text
                                                size="xs"
                                                c="dimmed"
                                                lineClamp={1}
                                              >
                                                {comp.description}
                                              </Text>
                                            )}
                                          </Box>
                                          {sel && (
                                            <>
                                              <Select
                                                size="xs"
                                                w={110}
                                                label="Level"
                                                data={[
                                                  {
                                                    value: "1",
                                                    label: "1 – Basic",
                                                  },
                                                  {
                                                    value: "2",
                                                    label: "2 – Developing",
                                                  },
                                                  {
                                                    value: "3",
                                                    label: "3 – Competent",
                                                  },
                                                  {
                                                    value: "4",
                                                    label: "4 – Advanced",
                                                  },
                                                  {
                                                    value: "5",
                                                    label: "5 – Expert",
                                                  },
                                                ]}
                                                value={String(sel.level)}
                                                onChange={(v) =>
                                                  setCreateCompSelections(
                                                    (prev) => ({
                                                      ...prev,
                                                      [comp.jp_competency_id]: {
                                                        ...prev[
                                                          comp.jp_competency_id
                                                        ],
                                                        level: Number(v) || 3,
                                                      },
                                                    }),
                                                  )
                                                }
                                              />
                                              <Switch
                                                size="xs"
                                                label="Critical"
                                                checked={sel.is_critical}
                                                onChange={(e) =>
                                                  setCreateCompSelections(
                                                    (prev) => ({
                                                      ...prev,
                                                      [comp.jp_competency_id]: {
                                                        ...prev[
                                                          comp.jp_competency_id
                                                        ],
                                                        is_critical:
                                                          e.currentTarget
                                                            .checked,
                                                      },
                                                    }),
                                                  )
                                                }
                                              />
                                              <Switch
                                                size="xs"
                                                label="Diff."
                                                checked={sel.is_differentiating}
                                                onChange={(e) =>
                                                  setCreateCompSelections(
                                                    (prev) => ({
                                                      ...prev,
                                                      [comp.jp_competency_id]: {
                                                        ...prev[
                                                          comp.jp_competency_id
                                                        ],
                                                        is_differentiating:
                                                          e.currentTarget
                                                            .checked,
                                                      },
                                                    }),
                                                  )
                                                }
                                              />
                                            </>
                                          )}
                                        </Group>
                                      </Paper>
                                    );
                                  })}
                                </Box>
                              ),
                            )}
                          </Box>
                        </Paper>
                      );
                    },
                  );
                })()
              )}
            </Stack>
          </Tabs.Panel>

          {/* Skills Tab */}
          <Tabs.Panel value="skills">
            <Stack>
              <Text size="sm" c="dimmed">
                Add skills to link when the profile is created.
              </Text>
              <Paper withBorder p="sm" radius="md">
                <Group align="end">
                  <TextInput
                    label="Skill Name"
                    placeholder="e.g., JavaScript"
                    value={createSkillDraft}
                    onChange={(e) => setCreateSkillDraft(e.currentTarget.value)}
                    style={{ flex: 1 }}
                  />
                  <NumberInput
                    label="Level"
                    min={1}
                    max={5}
                    value={createSkillLevelDraft}
                    onChange={(v) => setCreateSkillLevelDraft(Number(v) || 3)}
                    w={80}
                  />
                  <Switch
                    label="Critical"
                    checked={createSkillCritDraft}
                    onChange={(e) =>
                      setCreateSkillCritDraft(e.currentTarget.checked)
                    }
                  />
                  <Button
                    leftSection={<IconPlus size={14} />}
                    disabled={!createSkillDraft.trim()}
                    onClick={() => {
                      setCreateSkills((prev) => [
                        ...prev,
                        {
                          skill_name: createSkillDraft.trim(),
                          level: createSkillLevelDraft,
                          is_critical: createSkillCritDraft,
                        },
                      ]);
                      setCreateSkillDraft("");
                      setCreateSkillLevelDraft(3);
                      setCreateSkillCritDraft(false);
                    }}
                  >
                    Add
                  </Button>
                </Group>
              </Paper>
              {createSkills.length > 0 && (
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Skill</Table.Th>
                      <Table.Th w={60}>Level</Table.Th>
                      <Table.Th w={70}>Critical</Table.Th>
                      <Table.Th w={40} />
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {createSkills.map((s, i) => (
                      <Table.Tr key={i}>
                        <Table.Td>{s.skill_name}</Table.Td>
                        <Table.Td>
                          <Badge variant="light" color="teal" size="sm">
                            L{s.level}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          {s.is_critical ? (
                            <Badge size="xs" color="red" variant="light">
                              Yes
                            </Badge>
                          ) : (
                            "No"
                          )}
                        </Table.Td>
                        <Table.Td>
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            size="sm"
                            onClick={() =>
                              setCreateSkills((prev) =>
                                prev.filter((_, idx) => idx !== i),
                              )
                            }
                          >
                            <IconTrash size={14} />
                          </ActionIcon>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              )}
            </Stack>
          </Tabs.Panel>

          {/* Deliverables Tab */}
          <Tabs.Panel value="deliverables">
            <Stack>
              <Text size="sm" c="dimmed">
                Add deliverables to link when the profile is created.
              </Text>
              <Paper withBorder p="sm" radius="md">
                <Group align="end">
                  <TextInput
                    label="Deliverable"
                    placeholder="e.g., Monthly performance reports"
                    value={createDelDraft}
                    onChange={(e) => setCreateDelDraft(e.currentTarget.value)}
                    style={{ flex: 1 }}
                  />
                  <Button
                    leftSection={<IconPlus size={14} />}
                    disabled={!createDelDraft.trim()}
                    onClick={() => {
                      setCreateDeliverables((prev) => [
                        ...prev,
                        createDelDraft.trim(),
                      ]);
                      setCreateDelDraft("");
                    }}
                  >
                    Add
                  </Button>
                </Group>
              </Paper>
              {createDeliverables.length > 0 && (
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th w={40}>#</Table.Th>
                      <Table.Th>Deliverable</Table.Th>
                      <Table.Th w={40} />
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {createDeliverables.map((d, i) => (
                      <Table.Tr key={i}>
                        <Table.Td>
                          <Badge variant="light" color="gray" size="sm">
                            {i + 1}
                          </Badge>
                        </Table.Td>
                        <Table.Td>{d}</Table.Td>
                        <Table.Td>
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            size="sm"
                            onClick={() =>
                              setCreateDeliverables((prev) =>
                                prev.filter((_, idx) => idx !== i),
                              )
                            }
                          >
                            <IconTrash size={14} />
                          </ActionIcon>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              )}
            </Stack>
          </Tabs.Panel>

          {/* Requirements Tab */}
          <Tabs.Panel value="requirements">
            <Stack>
              <Text size="sm" c="dimmed">
                Define requirements to link when the profile is created.
              </Text>
              <Textarea
                label="Education"
                placeholder="e.g., Bachelor's degree in Computer Science"
                value={createReqs.education}
                onChange={(e) =>
                  setCreateReqs((prev) => ({
                    ...prev,
                    education: e.currentTarget.value,
                  }))
                }
                minRows={2}
              />
              <Textarea
                label="Experience"
                placeholder="e.g., 5+ years of software development"
                value={createReqs.experience}
                onChange={(e) =>
                  setCreateReqs((prev) => ({
                    ...prev,
                    experience: e.currentTarget.value,
                  }))
                }
                minRows={2}
              />
              <Textarea
                label="Certifications"
                placeholder="e.g., AWS Certified Solutions Architect"
                value={createReqs.certifications}
                onChange={(e) =>
                  setCreateReqs((prev) => ({
                    ...prev,
                    certifications: e.currentTarget.value,
                  }))
                }
                minRows={2}
              />
              <Textarea
                label="Other Requirements"
                placeholder="e.g., Strong communication and leadership skills"
                value={createReqs.other_requirements}
                onChange={(e) =>
                  setCreateReqs((prev) => ({
                    ...prev,
                    other_requirements: e.currentTarget.value,
                  }))
                }
                minRows={2}
              />
            </Stack>
          </Tabs.Panel>

          {/* Approval Tab */}
          <Tabs.Panel value="approval">
            <Stack>
              <Text size="sm" c="dimmed">
                Optionally submit this job profile for review and approval after
                creation. Both a Reviewer and Approver must be selected.
              </Text>
              <Select
                label="Reviewer (Office Reviewer)"
                placeholder="Select a reviewer (optional)"
                data={reviewerCandidates.map((r) => ({
                  value: String(r.id),
                  label: `${r.name} ${r.surname} (${r.email})`,
                }))}
                value={createReviewerId}
                onChange={setCreateReviewerId}
                searchable
                clearable
              />
              <Select
                label="Approver (Office Manager)"
                placeholder="Select an approver (optional)"
                data={approverCandidates.map((r) => ({
                  value: String(r.id),
                  label: `${r.name} ${r.surname} (${r.email})`,
                }))}
                value={createApproverId}
                onChange={setCreateApproverId}
                searchable
                clearable
              />
              {createReviewerId && createApproverId && (
                <Text size="xs" c="dimmed">
                  The profile will be submitted for review. The Reviewer will be
                  notified first, then the Approver after the review is complete.
                </Text>
              )}
              {((createReviewerId && !createApproverId) ||
                (!createReviewerId && createApproverId)) && (
                <Text size="xs" c="orange">
                  Both a Reviewer and Approver must be selected to submit for
                  review.
                </Text>
              )}
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </Modal>

      {/* Job Profile Preview Modal */}
      <JobProfilePreview
        profile={previewProfile}
        opened={previewOpened}
        onClose={() => {
          setPreviewOpened(false);
          setPreviewProfile(null);
        }}
        clientLogo={clientLogo}
      />
    </Stack>
  );
}
