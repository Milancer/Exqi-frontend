import { useState, useEffect, useCallback, useMemo } from "react";
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
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconBriefcase,
  IconEye,
  IconArrowLeft,
  IconTargetArrow,
  IconTool,
  IconChecklist,
  IconSchool,
  IconFileDescription,
} from "@tabler/icons-react";
import api from "../lib/api";
import { useUrlFilters } from "../hooks/useUrlFilters";

/* ─── Interfaces ─── */
interface CompetencyType {
  competency_type_id: number;
  competency_type: string;
}

interface CompetencyCluster {
  competency_cluster_id: number;
  cluster_name: string;
  competency_type_id: number;
}

interface Competency {
  competency_id: number;
  competency: string;
  description?: string;
  indicators?: string;
  competency_type_id: number;
  competency_cluster_id: number;
  competencyType?: CompetencyType;
  competencyCluster?: CompetencyCluster;
}

interface JPCompetency {
  job_profile_competency_id: number;
  competency_id: number;
  level: number;
  is_critical: boolean;
  is_differentiating: boolean;
  competency?: Competency;
}

interface JPSkill {
  job_profile_skill_id: number;
  skill_name: string;
  level: number;
  is_critical: boolean;
  status: string;
}

interface JPDeliverable {
  job_profile_deliverable_id: number;
  deliverable: string;
  sequence: number;
  status: string;
}

interface JPRequirement {
  job_profile_requirement_id: number;
  education: string;
  experience: string;
  certifications: string;
  other_requirements: string;
}

interface JobProfile {
  job_profile_id: number;
  job_title: string;
  job_purpose: string;
  division: string;
  job_family: string;
  job_location: string;
  level_of_work: number | null;
  department_id: number | null;
  job_grade_id: number | null;
  reports_to: number | null;
  status: string;
  competencies?: JPCompetency[];
  skills?: JPSkill[];
  deliverables?: JPDeliverable[];
  requirements?: JPRequirement;
}

const statusColors: Record<string, string> = {
  Active: "green",
  Draft: "blue",
  Archived: "gray",
};

export default function JobProfiles() {
  const [profiles, setProfiles] = useState<JobProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpened, setModalOpened] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // URL-persisted filters (listing view only)
  const f = useUrlFilters(["search", "jpStatus", "division"] as const);

  // Derive filter options from data (must be before any early return)
  const divisionOptions = useMemo(
    () =>
      [...new Set(profiles.map((p) => p.division).filter(Boolean))]
        .sort()
        .map((v) => ({ value: v, label: v })),
    [profiles],
  );

  // Filtered listing rows
  const filtered = useMemo(() => {
    const search = f.get("search")?.toLowerCase();
    const status = f.get("jpStatus");
    const division = f.get("division");
    return profiles.filter((p) => {
      if (search && !p.job_title.toLowerCase().includes(search)) return false;
      if (status && p.status !== status) return false;
      if (division && p.division !== division) return false;
      return true;
    });
  }, [profiles, f]);

  /* detail view state */
  const [selectedProfile, setSelectedProfile] = useState<JobProfile | null>(
    null,
  );
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>("description");

  /* reference data */
  const [allCompetencies, setAllCompetencies] = useState<Competency[]>([]);

  /* create-modal optional item state */
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

  /* forms */
  const descForm = useForm({
    initialValues: {
      job_title: "",
      job_purpose: "",
      division: "",
      job_family: "",
      job_location: "",
      level_of_work: "" as string | number,
      reports_to: "" as string | number,
      department_id: "" as string | number,
      job_grade_id: "" as string | number,
      status: "Draft",
    },
    validate: {
      job_title: (v) => (v.trim() ? null : "Job title is required"),
      job_purpose: (v) => (v.trim() ? null : "Job purpose is required"),
    },
  });

  /* ─── Fetchers ─── */
  const fetchProfiles = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/job-profiles");
      setProfiles(res.data);
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to fetch job profiles",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCompetencies = useCallback(async () => {
    try {
      const res = await api.get("/competencies");
      setAllCompetencies(res.data);
    } catch {
      /* silent */
    }
  }, []);

  const fetchDetail = useCallback(async (id: number) => {
    try {
      setDetailLoading(true);
      const res = await api.get(`/job-profiles/${id}`);
      setSelectedProfile(res.data);
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to load profile details",
        color: "red",
      });
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfiles();
    fetchCompetencies();
  }, [fetchProfiles, fetchCompetencies]);

  /* ─── Handlers (list) ─── */
  const openCreate = () => {
    descForm.reset();
    setEditingId(null);
    setModalOpened(true);
  };

  const openEdit = (p: JobProfile) => {
    descForm.setValues({
      job_title: p.job_title,
      job_purpose: p.job_purpose,
      division: p.division || "",
      job_family: p.job_family || "",
      job_location: p.job_location || "",
      level_of_work: p.level_of_work ?? "",
      reports_to: p.reports_to ?? "",
      department_id: p.department_id ?? "",
      job_grade_id: p.job_grade_id ?? "",
      status: p.status || "Draft",
    });
    setEditingId(p.job_profile_id);
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
      if (editingId) {
        await api.patch(`/job-profiles/${editingId}`, payload);
        notifications.show({
          title: "Updated",
          message: "Job profile updated",
          color: "green",
        });
        setModalOpened(false);
        descForm.reset();
        setEditingId(null);
        fetchProfiles();
      } else {
        const res = await api.post("/job-profiles", payload);
        const newId = res.data.job_profile_id;

        // Batch-add competencies
        const compEntries = Object.entries(createCompSelections);
        for (const [compId, sel] of compEntries) {
          try {
            await api.post(`/job-profiles/${newId}/competencies`, {
              competency_id: Number(compId),
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
        setModalOpened(false);
        descForm.reset();
        setEditingId(null);
        setActiveTab("description");
        fetchDetail(newId);
        fetchProfiles();
      }
    } catch (e: any) {
      notifications.show({
        title: "Error",
        message: e.response?.data?.message || "Operation failed",
        color: "red",
      });
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

  const openDetail = (p: JobProfile) => {
    setActiveTab("description");
    fetchDetail(p.job_profile_id);
  };

  const closeDetail = () => {
    setSelectedProfile(null);
    fetchProfiles();
  };

  /* ─── Detail view handlers ─── */

  // Competencies
  const handleRemoveCompetency = async (competencyId: number) => {
    if (!selectedProfile) return;
    try {
      await api.delete(
        `/job-profiles/${selectedProfile.job_profile_id}/competencies/${competencyId}`,
      );
      fetchDetail(selectedProfile.job_profile_id);
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to remove competency",
        color: "red",
      });
    }
  };

  // Skills
  const [addSkillName, setAddSkillName] = useState("");
  const [addSkillLevel, setAddSkillLevel] = useState<number>(3);
  const [addSkillCritical, setAddSkillCritical] = useState(false);

  const handleAddSkill = async () => {
    if (!selectedProfile || !addSkillName.trim()) return;
    try {
      await api.post(`/job-profiles/${selectedProfile.job_profile_id}/skills`, {
        skill_name: addSkillName,
        level: addSkillLevel,
        is_critical: addSkillCritical,
      });
      notifications.show({
        title: "Added",
        message: "Skill added",
        color: "green",
      });
      setAddSkillName("");
      setAddSkillLevel(3);
      setAddSkillCritical(false);
      fetchDetail(selectedProfile.job_profile_id);
    } catch (e: any) {
      notifications.show({
        title: "Error",
        message: e.response?.data?.message || "Failed to add skill",
        color: "red",
      });
    }
  };

  const handleRemoveSkill = async (skillId: number) => {
    if (!selectedProfile) return;
    try {
      await api.delete(
        `/job-profiles/${selectedProfile.job_profile_id}/skills/${skillId}`,
      );
      fetchDetail(selectedProfile.job_profile_id);
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to remove skill",
        color: "red",
      });
    }
  };

  // Deliverables
  const [addDeliverable, setAddDeliverable] = useState("");

  const handleAddDeliverable = async () => {
    if (!selectedProfile || !addDeliverable.trim()) return;
    const seq = (selectedProfile.deliverables?.length || 0) + 1;
    try {
      await api.post(
        `/job-profiles/${selectedProfile.job_profile_id}/deliverables`,
        { deliverable: addDeliverable, sequence: seq },
      );
      notifications.show({
        title: "Added",
        message: "Deliverable added",
        color: "green",
      });
      setAddDeliverable("");
      fetchDetail(selectedProfile.job_profile_id);
    } catch (e: any) {
      notifications.show({
        title: "Error",
        message: e.response?.data?.message || "Failed to add deliverable",
        color: "red",
      });
    }
  };

  const handleRemoveDeliverable = async (deliverableId: number) => {
    if (!selectedProfile) return;
    try {
      await api.delete(
        `/job-profiles/${selectedProfile.job_profile_id}/deliverables/${deliverableId}`,
      );
      fetchDetail(selectedProfile.job_profile_id);
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to remove deliverable",
        color: "red",
      });
    }
  };

  // Requirements
  const [reqEducation, setReqEducation] = useState("");
  const [reqExperience, setReqExperience] = useState("");
  const [reqCerts, setReqCerts] = useState("");
  const [reqOther, setReqOther] = useState("");

  useEffect(() => {
    if (selectedProfile?.requirements) {
      const r = selectedProfile.requirements;
      setReqEducation(r.education || "");
      setReqExperience(r.experience || "");
      setReqCerts(r.certifications || "");
      setReqOther(r.other_requirements || "");
    } else {
      setReqEducation("");
      setReqExperience("");
      setReqCerts("");
      setReqOther("");
    }
  }, [selectedProfile]);

  const handleSaveRequirements = async () => {
    if (!selectedProfile) return;
    try {
      await api.patch(
        `/job-profiles/${selectedProfile.job_profile_id}/requirements`,
        {
          education: reqEducation,
          experience: reqExperience,
          certifications: reqCerts,
          other_requirements: reqOther,
        },
      );
      notifications.show({
        title: "Saved",
        message: "Requirements updated",
        color: "green",
      });
      fetchDetail(selectedProfile.job_profile_id);
    } catch (e: any) {
      notifications.show({
        title: "Error",
        message: e.response?.data?.message || "Failed to save requirements",
        color: "red",
      });
    }
  };

  /* ─── Detail Update (description fields) ─── */
  const handleUpdateDescription = async () => {
    if (!selectedProfile) return;
    try {
      await api.patch(
        `/job-profiles/${selectedProfile.job_profile_id}`,
        descForm.values,
      );
      notifications.show({
        title: "Saved",
        message: "Description updated",
        color: "green",
      });
      fetchDetail(selectedProfile.job_profile_id);
    } catch (e: any) {
      notifications.show({
        title: "Error",
        message: e.response?.data?.message || "Failed to update",
        color: "red",
      });
    }
  };

  // When opening detail, also populate the desc form
  useEffect(() => {
    if (selectedProfile) {
      descForm.setValues({
        job_title: selectedProfile.job_title || "",
        job_purpose: selectedProfile.job_purpose || "",
        division: selectedProfile.division || "",
        job_family: selectedProfile.job_family || "",
        job_location: selectedProfile.job_location || "",
        level_of_work: selectedProfile.level_of_work ?? "",
        reports_to: selectedProfile.reports_to ?? "",
        department_id: selectedProfile.department_id ?? "",
        job_grade_id: selectedProfile.job_grade_id ?? "",
        status: selectedProfile.status || "Draft",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProfile]);

  /* ───────── DETAIL VIEW ───────── */
  if (selectedProfile) {
    if (detailLoading) {
      return (
        <Center p="xl">
          <Loader />
        </Center>
      );
    }

    return (
      <Stack gap="lg">
        <Group>
          <ActionIcon variant="subtle" onClick={closeDetail}>
            <IconArrowLeft size={20} />
          </ActionIcon>
          <Box>
            <Title order={2} fw={800}>
              {selectedProfile.job_title}
            </Title>
            <Text size="sm" c="dimmed">
              {selectedProfile.division}
              {selectedProfile.job_family
                ? ` · ${selectedProfile.job_family}`
                : ""}
              {selectedProfile.job_location
                ? ` · ${selectedProfile.job_location}`
                : ""}
            </Text>
          </Box>
          <Badge
            ml="auto"
            variant="light"
            color={statusColors[selectedProfile.status] || "gray"}
          >
            {selectedProfile.status}
          </Badge>
        </Group>

        <Paper
          withBorder
          p="md"
          style={{ border: "1px solid var(--mantine-color-default-border)" }}
        >
          <Tabs value={activeTab} onChange={setActiveTab}>
            <Tabs.List>
              <Tabs.Tab
                value="description"
                leftSection={<IconFileDescription size={14} />}
              >
                Description
              </Tabs.Tab>
              <Tabs.Tab
                value="competencies"
                leftSection={<IconTargetArrow size={14} />}
              >
                Competencies{" "}
                <Badge size="xs" variant="light" color="indigo" ml={4}>
                  {selectedProfile.competencies?.length || 0}
                </Badge>
              </Tabs.Tab>
              <Tabs.Tab value="skills" leftSection={<IconTool size={14} />}>
                Skills{" "}
                <Badge size="xs" variant="light" color="teal" ml={4}>
                  {selectedProfile.skills?.length || 0}
                </Badge>
              </Tabs.Tab>
              <Tabs.Tab
                value="deliverables"
                leftSection={<IconChecklist size={14} />}
              >
                Deliverables{" "}
                <Badge size="xs" variant="light" color="orange" ml={4}>
                  {selectedProfile.deliverables?.length || 0}
                </Badge>
              </Tabs.Tab>
              <Tabs.Tab
                value="requirements"
                leftSection={<IconSchool size={14} />}
              >
                Requirements
              </Tabs.Tab>
            </Tabs.List>

            {/* ─── Description Tab ─── */}
            <Tabs.Panel value="description" pt="md">
              <Stack>
                <Group grow>
                  <TextInput
                    label="Job Title"
                    {...descForm.getInputProps("job_title")}
                  />
                  <TextInput
                    label="Division"
                    {...descForm.getInputProps("division")}
                  />
                </Group>
                <Textarea
                  label="Job Purpose"
                  minRows={3}
                  {...descForm.getInputProps("job_purpose")}
                />
                <Group grow>
                  <TextInput
                    label="Job Family"
                    {...descForm.getInputProps("job_family")}
                  />
                  <TextInput
                    label="Location"
                    {...descForm.getInputProps("job_location")}
                  />
                  <NumberInput
                    label="Level of Work"
                    min={1}
                    max={7}
                    {...descForm.getInputProps("level_of_work")}
                  />
                </Group>
                <Group grow>
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
                      { value: "Draft", label: "Draft" },
                      { value: "Active", label: "Active" },
                      { value: "Archived", label: "Archived" },
                    ]}
                    {...descForm.getInputProps("status")}
                  />
                </Group>
                <Group grow>
                  <NumberInput
                    label="Department ID"
                    placeholder="Optional"
                    min={1}
                    {...descForm.getInputProps("department_id")}
                  />
                  <NumberInput
                    label="Job Grade ID"
                    placeholder="Optional"
                    min={1}
                    {...descForm.getInputProps("job_grade_id")}
                  />
                </Group>
                <Button
                  onClick={handleUpdateDescription}
                  variant="gradient"
                  gradient={{ from: "grape", to: "violet", deg: 135 }}
                  w={200}
                >
                  Save Description
                </Button>
              </Stack>
            </Tabs.Panel>

            {/* ─── Competencies Tab ─── */}
            <Tabs.Panel value="competencies" pt="md">
              <Stack>
                <Text size="sm" c="dimmed">
                  Select competencies from your organisation's framework. Check
                  to link, set the required proficiency level, and mark as
                  critical or differentiating.
                </Text>

                {(() => {
                  // Group competencies by type, then by cluster
                  const types = new Map<
                    number,
                    { name: string; comps: Competency[] }
                  >();
                  allCompetencies.forEach((c) => {
                    const typeId = c.competency_type_id || 0;
                    const typeName =
                      c.competencyType?.competency_type || "Other";
                    if (!types.has(typeId))
                      types.set(typeId, { name: typeName, comps: [] });
                    types.get(typeId)!.comps.push(c);
                  });

                  const linkedMap = new Map<number, JPCompetency>();
                  (selectedProfile.competencies || []).forEach((jpc) =>
                    linkedMap.set(jpc.competency_id, jpc),
                  );

                  if (allCompetencies.length === 0) {
                    return (
                      <Text c="dimmed" size="sm" ta="center" py="lg">
                        No competencies available. Add competencies in the
                        Competencies module first.
                      </Text>
                    );
                  }

                  return Array.from(types.entries()).map(
                    ([typeId, { name: typeName, comps }]) => {
                      // Group by cluster within this type
                      const clusters = new Map<string, Competency[]>();
                      comps.forEach((c) => {
                        const clusterName =
                          c.competencyCluster?.cluster_name || "Unclustered";
                        if (!clusters.has(clusterName))
                          clusters.set(clusterName, []);
                        clusters.get(clusterName)!.push(c);
                      });

                      const linkedInType = comps.filter((c) =>
                        linkedMap.has(c.competency_id),
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
                            p="sm"
                            style={{
                              background: "var(--mantine-color-indigo-6)",
                              color: "white",
                              cursor: "pointer",
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
                                {linkedInType} / {comps.length} selected
                              </Badge>
                            </Group>
                          </Box>
                          <Box p="sm">
                            {Array.from(clusters.entries()).map(
                              ([clusterName, clusterComps]) => (
                                <Box key={clusterName} mb="md">
                                  <Text
                                    size="xs"
                                    fw={700}
                                    c="dimmed"
                                    tt="uppercase"
                                    mb={6}
                                  >
                                    {clusterName}
                                  </Text>
                                  {clusterComps.map((comp) => {
                                    const linked = linkedMap.get(
                                      comp.competency_id,
                                    );
                                    const isSelected = !!linked;
                                    return (
                                      <Paper
                                        key={comp.competency_id}
                                        withBorder
                                        p="xs"
                                        mb={6}
                                        radius="sm"
                                        style={{
                                          borderColor: isSelected
                                            ? "var(--mantine-color-indigo-4)"
                                            : "var(--mantine-color-default-border)",
                                          background: isSelected
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
                                            checked={isSelected}
                                            onChange={async () => {
                                              if (!selectedProfile) return;
                                              if (isSelected) {
                                                await handleRemoveCompetency(
                                                  comp.competency_id,
                                                );
                                              } else {
                                                try {
                                                  await api.post(
                                                    `/job-profiles/${selectedProfile.job_profile_id}/competencies`,
                                                    {
                                                      competency_id:
                                                        comp.competency_id,
                                                      level: 3,
                                                      is_critical: false,
                                                      is_differentiating: false,
                                                    },
                                                  );
                                                  fetchDetail(
                                                    selectedProfile.job_profile_id,
                                                  );
                                                } catch {
                                                  notifications.show({
                                                    title: "Error",
                                                    message: "Failed to add",
                                                    color: "red",
                                                  });
                                                }
                                              }
                                            }}
                                            size="xs"
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
                                          {isSelected && (
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
                                                value={String(linked!.level)}
                                                onChange={() => {}}
                                                disabled
                                              />
                                              <Badge
                                                size="xs"
                                                color={
                                                  linked!.is_critical
                                                    ? "red"
                                                    : "gray"
                                                }
                                                variant="light"
                                              >
                                                {linked!.is_critical
                                                  ? "Critical"
                                                  : "Not Critical"}
                                              </Badge>
                                              <Badge
                                                size="xs"
                                                color={
                                                  linked!.is_differentiating
                                                    ? "orange"
                                                    : "gray"
                                                }
                                                variant="light"
                                              >
                                                {linked!.is_differentiating
                                                  ? "Differentiating"
                                                  : "Standard"}
                                              </Badge>
                                              <Tooltip label="Remove">
                                                <ActionIcon
                                                  variant="subtle"
                                                  color="red"
                                                  size="sm"
                                                  onClick={() =>
                                                    handleRemoveCompetency(
                                                      comp.competency_id,
                                                    )
                                                  }
                                                >
                                                  <IconTrash size={14} />
                                                </ActionIcon>
                                              </Tooltip>
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
                })()}
              </Stack>
            </Tabs.Panel>

            {/* ─── Skills Tab ─── */}
            <Tabs.Panel value="skills" pt="md">
              <Stack>
                <Text size="sm" c="dimmed">
                  Add specific skills required for this role.
                </Text>

                <Paper withBorder p="sm" radius="md">
                  <Group align="end">
                    <TextInput
                      label="Skill Name"
                      placeholder="e.g., JavaScript"
                      value={addSkillName}
                      onChange={(e) => setAddSkillName(e.currentTarget.value)}
                      style={{ flex: 1 }}
                    />
                    <NumberInput
                      label="Level"
                      min={1}
                      max={5}
                      value={addSkillLevel}
                      onChange={(v) => setAddSkillLevel(Number(v) || 3)}
                      w={80}
                    />
                    <Switch
                      label="Critical"
                      checked={addSkillCritical}
                      onChange={(e) =>
                        setAddSkillCritical(e.currentTarget.checked)
                      }
                    />
                    <Button
                      leftSection={<IconPlus size={14} />}
                      onClick={handleAddSkill}
                      disabled={!addSkillName.trim()}
                    >
                      Add
                    </Button>
                  </Group>
                </Paper>

                {selectedProfile.skills && selectedProfile.skills.length > 0 ? (
                  <Table>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Skill</Table.Th>
                        <Table.Th w={80}>Level</Table.Th>
                        <Table.Th w={80}>Critical</Table.Th>
                        <Table.Th w={60} />
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {selectedProfile.skills.map((s) => (
                        <Table.Tr key={s.job_profile_skill_id}>
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
                              <Text size="xs" c="dimmed">
                                No
                              </Text>
                            )}
                          </Table.Td>
                          <Table.Td>
                            <Tooltip label="Remove">
                              <ActionIcon
                                variant="subtle"
                                color="red"
                                onClick={() =>
                                  handleRemoveSkill(s.job_profile_skill_id)
                                }
                              >
                                <IconTrash size={14} />
                              </ActionIcon>
                            </Tooltip>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                ) : (
                  <Text c="dimmed" size="sm" ta="center" py="lg">
                    No skills added yet
                  </Text>
                )}
              </Stack>
            </Tabs.Panel>

            {/* ─── Deliverables Tab ─── */}
            <Tabs.Panel value="deliverables" pt="md">
              <Stack>
                <Text size="sm" c="dimmed">
                  Define the key deliverables expected from this role.
                </Text>

                <Paper withBorder p="sm" radius="md">
                  <Group align="end">
                    <Textarea
                      label="Deliverable"
                      placeholder="Describe a key deliverable"
                      value={addDeliverable}
                      onChange={(e) => setAddDeliverable(e.currentTarget.value)}
                      style={{ flex: 1 }}
                      minRows={1}
                      autosize
                    />
                    <Button
                      leftSection={<IconPlus size={14} />}
                      onClick={handleAddDeliverable}
                      disabled={!addDeliverable.trim()}
                    >
                      Add
                    </Button>
                  </Group>
                </Paper>

                {selectedProfile.deliverables &&
                selectedProfile.deliverables.length > 0 ? (
                  <Table>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th w={50}>#</Table.Th>
                        <Table.Th>Deliverable</Table.Th>
                        <Table.Th w={60} />
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {selectedProfile.deliverables
                        .sort((a, b) => a.sequence - b.sequence)
                        .map((d) => (
                          <Table.Tr key={d.job_profile_deliverable_id}>
                            <Table.Td>
                              <Badge variant="light" color="gray" size="sm">
                                {d.sequence}
                              </Badge>
                            </Table.Td>
                            <Table.Td>{d.deliverable}</Table.Td>
                            <Table.Td>
                              <Tooltip label="Remove">
                                <ActionIcon
                                  variant="subtle"
                                  color="red"
                                  onClick={() =>
                                    handleRemoveDeliverable(
                                      d.job_profile_deliverable_id,
                                    )
                                  }
                                >
                                  <IconTrash size={14} />
                                </ActionIcon>
                              </Tooltip>
                            </Table.Td>
                          </Table.Tr>
                        ))}
                    </Table.Tbody>
                  </Table>
                ) : (
                  <Text c="dimmed" size="sm" ta="center" py="lg">
                    No deliverables defined yet
                  </Text>
                )}
              </Stack>
            </Tabs.Panel>

            {/* ─── Requirements Tab ─── */}
            <Tabs.Panel value="requirements" pt="md">
              <Stack>
                <Text size="sm" c="dimmed">
                  Define education, experience, and certification requirements.
                </Text>
                <Textarea
                  label="Education"
                  placeholder="e.g., Bachelor's degree in Computer Science"
                  value={reqEducation}
                  onChange={(e) => setReqEducation(e.currentTarget.value)}
                  minRows={2}
                  autosize
                />
                <Textarea
                  label="Experience"
                  placeholder="e.g., 5+ years of software development"
                  value={reqExperience}
                  onChange={(e) => setReqExperience(e.currentTarget.value)}
                  minRows={2}
                  autosize
                />
                <Textarea
                  label="Certifications"
                  placeholder="e.g., AWS Certified Solutions Architect"
                  value={reqCerts}
                  onChange={(e) => setReqCerts(e.currentTarget.value)}
                  minRows={2}
                  autosize
                />
                <Textarea
                  label="Other Requirements"
                  placeholder="e.g., Strong communication and leadership skills"
                  value={reqOther}
                  onChange={(e) => setReqOther(e.currentTarget.value)}
                  minRows={2}
                  autosize
                />
                <Button
                  onClick={handleSaveRequirements}
                  variant="gradient"
                  gradient={{ from: "grape", to: "violet", deg: 135 }}
                  w={200}
                >
                  Save Requirements
                </Button>
              </Stack>
            </Tabs.Panel>
          </Tabs>
        </Paper>
      </Stack>
    );
  }

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
            placeholder="Search job title…"
            value={f.get("search") || ""}
            onChange={(e) => f.set("search", e.currentTarget.value || null)}
            style={{ flex: 1, maxWidth: 240 }}
          />
          <Select
            placeholder="All Statuses"
            data={[
              { value: "Draft", label: "Draft" },
              { value: "Active", label: "Active" },
              { value: "Archived", label: "Archived" },
            ]}
            value={f.get("jpStatus")}
            onChange={(v) => f.set("jpStatus", v)}
            clearable
            w={140}
          />
          <Select
            placeholder="All Divisions"
            data={divisionOptions}
            value={f.get("division")}
            onChange={(v) => f.set("division", v)}
            clearable
            searchable
            w={180}
          />
          <Badge variant="light" color="gray" size="lg">
            {filtered.length} / {profiles.length}
          </Badge>
        </Group>
        {loading ? (
          <Center p="xl">
            <Loader />
          </Center>
        ) : filtered.length === 0 ? (
          <Stack align="center" py={60} gap="md">
            <IconBriefcase
              size={48}
              stroke={1}
              style={{ color: "var(--mantine-color-dimmed)" }}
            />
            <Text c="dimmed" size="lg">
              {profiles.length === 0
                ? "No job profiles yet"
                : "No profiles match filters"}
            </Text>
            {profiles.length === 0 && (
              <Button variant="light" onClick={openCreate}>
                Create your first job profile
              </Button>
            )}
          </Stack>
        ) : (
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Job Title</Table.Th>
                <Table.Th>Division</Table.Th>
                <Table.Th>Job Family</Table.Th>
                <Table.Th w={120}>Competencies</Table.Th>
                <Table.Th w={90}>Status</Table.Th>
                <Table.Th w={120}>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filtered.map((p) => (
                <Table.Tr key={p.job_profile_id}>
                  <Table.Td>
                    <Text size="sm" fw={500}>
                      {p.job_title}
                    </Text>
                    <Text size="xs" c="dimmed" lineClamp={1}>
                      {p.job_purpose}
                    </Text>
                  </Table.Td>
                  <Table.Td>{p.division}</Table.Td>
                  <Table.Td>{p.job_family}</Table.Td>
                  <Table.Td>
                    <Badge variant="light" color="indigo" size="sm">
                      {p.competencies?.length || 0}
                    </Badge>
                  </Table.Td>
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
                      <Tooltip label="View Details">
                        <ActionIcon
                          variant="subtle"
                          color="teal"
                          onClick={() => openDetail(p)}
                        >
                          <IconEye size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Edit">
                        <ActionIcon
                          variant="subtle"
                          color="blue"
                          onClick={() => openEdit(p)}
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
      </Paper>

      {/* ─── Create/Edit Modal (Tabbed) ─── */}
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
        }}
        title={editingId ? "Edit Job Profile" : "Create Job Profile"}
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
            {!editingId && (
              <>
                <Tabs.Tab
                  value="competencies"
                  leftSection={<IconTargetArrow size={14} />}
                >
                  Competencies
                  {Object.values(createCompSelections).filter(Boolean).length >
                    0 && (
                    <Badge size="xs" variant="light" color="indigo" ml={4}>
                      {
                        Object.values(createCompSelections).filter(Boolean)
                          .length
                      }
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
                  value="requirements"
                  leftSection={<IconSchool size={14} />}
                >
                  Requirements
                </Tabs.Tab>
              </>
            )}
          </Tabs.List>

          {/* Description Tab */}
          <Tabs.Panel value="description">
            <form onSubmit={descForm.onSubmit(handleSubmit)}>
              <Stack>
                <TextInput
                  label="Job Title"
                  placeholder="e.g., Senior Software Engineer"
                  required
                  {...descForm.getInputProps("job_title")}
                />
                <Textarea
                  label="Job Purpose"
                  placeholder="Describe the purpose of this role"
                  required
                  minRows={3}
                  {...descForm.getInputProps("job_purpose")}
                />
                <Group grow>
                  <TextInput
                    label="Division"
                    placeholder="e.g., Engineering"
                    {...descForm.getInputProps("division")}
                  />
                  <TextInput
                    label="Job Family"
                    placeholder="e.g., Software Development"
                    {...descForm.getInputProps("job_family")}
                  />
                </Group>
                <Group grow>
                  <TextInput
                    label="Location"
                    placeholder="e.g., Remote"
                    {...descForm.getInputProps("job_location")}
                  />
                  <NumberInput
                    label="Level of Work"
                    min={1}
                    max={7}
                    placeholder="1-7"
                    {...descForm.getInputProps("level_of_work")}
                  />
                </Group>
                <Group grow>
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
                      { value: "Draft", label: "Draft" },
                      { value: "Active", label: "Active" },
                      { value: "Archived", label: "Archived" },
                    ]}
                    {...descForm.getInputProps("status")}
                  />
                </Group>
                <Group grow>
                  <NumberInput
                    label="Department ID"
                    placeholder="Optional"
                    min={1}
                    {...descForm.getInputProps("department_id")}
                  />
                  <NumberInput
                    label="Job Grade ID"
                    placeholder="Optional"
                    min={1}
                    {...descForm.getInputProps("job_grade_id")}
                  />
                </Group>
                <Button
                  type="submit"
                  fullWidth
                  variant="gradient"
                  gradient={{ from: "grape", to: "violet", deg: 135 }}
                >
                  {editingId ? "Update" : "Create Job Profile"}
                </Button>
              </Stack>
            </form>
          </Tabs.Panel>

          {/* Competencies Tab (create only) */}
          {!editingId && (
            <Tabs.Panel value="competencies">
              <Stack>
                <Text size="sm" c="dimmed">
                  Select competencies to link when the profile is created.
                  Toggle on to include, then set level and flags.
                </Text>
                {allCompetencies.length === 0 ? (
                  <Text c="dimmed" size="sm" ta="center" py="lg">
                    No competencies available. Add them in the Competencies
                    module first.
                  </Text>
                ) : (
                  (() => {
                    const types = new Map<
                      number,
                      { name: string; comps: Competency[] }
                    >();
                    allCompetencies.forEach((c) => {
                      const typeId = c.competency_type_id || 0;
                      const typeName =
                        c.competencyType?.competency_type || "Other";
                      if (!types.has(typeId))
                        types.set(typeId, { name: typeName, comps: [] });
                      types.get(typeId)!.comps.push(c);
                    });

                    return Array.from(types.entries()).map(
                      ([typeId, { name: typeName, comps }]) => {
                        const clusters = new Map<string, Competency[]>();
                        comps.forEach((c) => {
                          const cn =
                            c.competencyCluster?.cluster_name || "Unclustered";
                          if (!clusters.has(cn)) clusters.set(cn, []);
                          clusters.get(cn)!.push(c);
                        });
                        const selectedCount = comps.filter(
                          (c) => createCompSelections[c.competency_id],
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
                                          comp.competency_id
                                        ];
                                      return (
                                        <Paper
                                          key={comp.competency_id}
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
                                                      prev[comp.competency_id]
                                                    ) {
                                                      const next = { ...prev };
                                                      delete next[
                                                        comp.competency_id
                                                      ];
                                                      return next;
                                                    }
                                                    return {
                                                      ...prev,
                                                      [comp.competency_id]: {
                                                        level: 3,
                                                        is_critical: false,
                                                        is_differentiating: false,
                                                      },
                                                    };
                                                  },
                                                );
                                              }}
                                            />
                                            <Box
                                              style={{ flex: 1, minWidth: 0 }}
                                            >
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
                                                        [comp.competency_id]: {
                                                          ...prev[
                                                            comp.competency_id
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
                                                        [comp.competency_id]: {
                                                          ...prev[
                                                            comp.competency_id
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
                                                  checked={
                                                    sel.is_differentiating
                                                  }
                                                  onChange={(e) =>
                                                    setCreateCompSelections(
                                                      (prev) => ({
                                                        ...prev,
                                                        [comp.competency_id]: {
                                                          ...prev[
                                                            comp.competency_id
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
          )}

          {/* Skills Tab (create only) */}
          {!editingId && (
            <Tabs.Panel value="skills">
              <Stack>
                <Text size="sm" c="dimmed">
                  Add skills that will be linked when the profile is created.
                </Text>
                <Paper withBorder p="sm" radius="md">
                  <Group align="end">
                    <TextInput
                      label="Skill Name"
                      placeholder="e.g., JavaScript"
                      value={createSkillDraft}
                      onChange={(e) =>
                        setCreateSkillDraft(e.currentTarget.value)
                      }
                      style={{ flex: 1 }}
                    />
                    <NumberInput
                      label="Level"
                      min={1}
                      max={5}
                      w={80}
                      value={createSkillLevelDraft}
                      onChange={(v) => setCreateSkillLevelDraft(Number(v) || 3)}
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
                            skill_name: createSkillDraft,
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
                        <Table.Th w={80}>Level</Table.Th>
                        <Table.Th w={80}>Critical</Table.Th>
                        <Table.Th w={60} />
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
                              <Text size="xs" c="dimmed">
                                No
                              </Text>
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
          )}

          {/* Deliverables Tab (create only) */}
          {!editingId && (
            <Tabs.Panel value="deliverables">
              <Stack>
                <Text size="sm" c="dimmed">
                  Define key deliverables for this role.
                </Text>
                <Paper withBorder p="sm" radius="md">
                  <Group align="end">
                    <Textarea
                      label="Deliverable"
                      placeholder="Describe a key deliverable"
                      value={createDelDraft}
                      onChange={(e) => setCreateDelDraft(e.currentTarget.value)}
                      style={{ flex: 1 }}
                      minRows={1}
                      autosize
                    />
                    <Button
                      leftSection={<IconPlus size={14} />}
                      disabled={!createDelDraft.trim()}
                      onClick={() => {
                        setCreateDeliverables((prev) => [
                          ...prev,
                          createDelDraft,
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
                        <Table.Th w={50}>#</Table.Th>
                        <Table.Th>Deliverable</Table.Th>
                        <Table.Th w={60} />
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
          )}

          {/* Requirements Tab (create only) */}
          {!editingId && (
            <Tabs.Panel value="requirements">
              <Stack>
                <Text size="sm" c="dimmed">
                  Specify position requirements (optional).
                </Text>
                <Textarea
                  label="Education"
                  placeholder="e.g., Bachelor's degree..."
                  value={createReqs.education}
                  onChange={(e) =>
                    setCreateReqs((p) => ({
                      ...p,
                      education: e.currentTarget.value,
                    }))
                  }
                  minRows={2}
                  autosize
                />
                <Textarea
                  label="Experience"
                  placeholder="e.g., 5+ years..."
                  value={createReqs.experience}
                  onChange={(e) =>
                    setCreateReqs((p) => ({
                      ...p,
                      experience: e.currentTarget.value,
                    }))
                  }
                  minRows={2}
                  autosize
                />
                <Textarea
                  label="Certifications"
                  placeholder="e.g., AWS Certified..."
                  value={createReqs.certifications}
                  onChange={(e) =>
                    setCreateReqs((p) => ({
                      ...p,
                      certifications: e.currentTarget.value,
                    }))
                  }
                  minRows={2}
                  autosize
                />
                <Textarea
                  label="Other Requirements"
                  placeholder="e.g., Strong communication..."
                  value={createReqs.other_requirements}
                  onChange={(e) =>
                    setCreateReqs((p) => ({
                      ...p,
                      other_requirements: e.currentTarget.value,
                    }))
                  }
                  minRows={2}
                  autosize
                />
              </Stack>
            </Tabs.Panel>
          )}
        </Tabs>
      </Modal>
    </Stack>
  );
}
