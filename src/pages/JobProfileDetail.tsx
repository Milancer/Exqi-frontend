import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Title,
  Button,
  Table,
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
  IconArrowLeft,
  IconTargetArrow,
  IconTool,
  IconChecklist,
  IconSchool,
  IconFileDescription,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import api from "../services/api";

import type {
  JobProfile,
  JpCompetency,
  JPCompetencyLink,
} from "../services/job-profiles/interfaces";

const statusColors: Record<string, string> = {
  Active: "green",
  Draft: "blue",
  Archived: "gray",
};

/* ═══════════════════════════════════════════════════════════════════
   JOB PROFILE DETAIL PAGE
   ═══════════════════════════════════════════════════════════════════ */

export default function JobProfileDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const profileId = Number(id);

  /* ─── State ─── */
  const [profile, setProfile] = useState<JobProfile | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const hasLoaded = useRef(false);
  const [activeTab, setActiveTab] = useState<string | null>("description");

  // Reference data (all JP competencies for the competency picker)
  const [allCompetencies, setAllCompetencies] = useState<JpCompetency[]>([]);

  // All profiles for the "Reports To" dropdown
  const [allProfiles, setAllProfiles] = useState<JobProfile[]>([]);

  // Skills
  const [addSkillName, setAddSkillName] = useState("");
  const [addSkillLevel, setAddSkillLevel] = useState<number>(3);
  const [addSkillCritical, setAddSkillCritical] = useState(false);

  // Deliverables
  const [addDeliverable, setAddDeliverable] = useState("");

  // Requirements
  const [reqEducation, setReqEducation] = useState("");
  const [reqExperience, setReqExperience] = useState("");
  const [reqCerts, setReqCerts] = useState("");
  const [reqOther, setReqOther] = useState("");

  /* ─── Description form ─── */
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
  // Initial load — shows full-page spinner
  const fetchProfile = useCallback(async () => {
    try {
      setInitialLoading(true);
      const res = await api.get(`/job-profiles/${profileId}`);
      setProfile(res.data);
      hasLoaded.current = true;
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to load job profile",
        color: "red",
      });
    } finally {
      setInitialLoading(false);
    }
  }, [profileId]);

  // Silent refresh — updates data in place without unmounting UI
  const refreshProfile = useCallback(async () => {
    try {
      const res = await api.get(`/job-profiles/${profileId}`);
      setProfile(res.data);
    } catch {
      /* silent – keep existing data visible */
    }
  }, [profileId]);

  const fetchCompetencies = useCallback(async () => {
    try {
      const res = await api.get("/job-profiles/competency-items");
      setAllCompetencies(res.data);
    } catch {
      /* silent */
    }
  }, []);

  const fetchAllProfiles = useCallback(async () => {
    try {
      const res = await api.get("/job-profiles");
      setAllProfiles(res.data);
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchCompetencies();
    fetchAllProfiles();
  }, [fetchProfile, fetchCompetencies, fetchAllProfiles]);

  // Populate form when profile loads
  useEffect(() => {
    if (profile) {
      descForm.setValues({
        job_title: profile.job_title || "",
        job_purpose: profile.job_purpose || "",
        division: profile.division || "",
        job_family: profile.job_family || "",
        job_location: profile.job_location || "",
        level_of_work: profile.level_of_work ?? "",
        reports_to: profile.reports_to ?? "",
        department_id: profile.department_id ?? "",
        job_grade_id: profile.job_grade_id ?? "",
        status: profile.status || "Draft",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  // Populate requirements when profile loads
  useEffect(() => {
    if (profile?.requirements) {
      const r = profile.requirements;
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
  }, [profile]);

  /* ─── Handlers ─── */

  // Description update
  const handleUpdateDescription = async () => {
    if (!profile) return;
    const validation = descForm.validate();
    if (validation.hasErrors) return;
    try {
      setSaving(true);
      const values = descForm.values;
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
      await api.patch(`/job-profiles/${profile.job_profile_id}`, payload);
      notifications.show({
        title: "Saved",
        message: "Description updated",
        color: "green",
      });
      await refreshProfile();
    } catch (e: any) {
      notifications.show({
        title: "Error",
        message: e.response?.data?.message || "Failed to update",
        color: "red",
      });
    } finally {
      setSaving(false);
    }
  };

  // Competencies
  const handleRemoveCompetency = async (competencyId: number) => {
    if (!profile) return;
    try {
      setSaving(true);
      await api.delete(
        `/job-profiles/${profile.job_profile_id}/competencies/${competencyId}`,
      );
      await refreshProfile();
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to remove competency",
        color: "red",
      });
    } finally {
      setSaving(false);
    }
  };

  // Skills
  const handleAddSkill = async () => {
    if (!profile || !addSkillName.trim()) return;
    try {
      setSaving(true);
      await api.post(`/job-profiles/${profile.job_profile_id}/skills`, {
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
      await refreshProfile();
    } catch (e: any) {
      notifications.show({
        title: "Error",
        message: e.response?.data?.message || "Failed to add skill",
        color: "red",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveSkill = async (skillId: number) => {
    if (!profile) return;
    try {
      setSaving(true);
      await api.delete(
        `/job-profiles/${profile.job_profile_id}/skills/${skillId}`,
      );
      await refreshProfile();
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to remove skill",
        color: "red",
      });
    } finally {
      setSaving(false);
    }
  };

  // Deliverables
  const handleAddDeliverable = async () => {
    if (!profile || !addDeliverable.trim()) return;
    const seq = (profile.deliverables?.length || 0) + 1;
    try {
      setSaving(true);
      await api.post(`/job-profiles/${profile.job_profile_id}/deliverables`, {
        deliverable: addDeliverable,
        sequence: seq,
      });
      notifications.show({
        title: "Added",
        message: "Deliverable added",
        color: "green",
      });
      setAddDeliverable("");
      await refreshProfile();
    } catch (e: any) {
      notifications.show({
        title: "Error",
        message: e.response?.data?.message || "Failed to add deliverable",
        color: "red",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveDeliverable = async (deliverableId: number) => {
    if (!profile) return;
    try {
      setSaving(true);
      await api.delete(
        `/job-profiles/${profile.job_profile_id}/deliverables/${deliverableId}`,
      );
      await refreshProfile();
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to remove deliverable",
        color: "red",
      });
    } finally {
      setSaving(false);
    }
  };

  // Requirements
  const handleSaveRequirements = async () => {
    if (!profile) return;
    try {
      setSaving(true);
      await api.patch(`/job-profiles/${profile.job_profile_id}/requirements`, {
        education: reqEducation,
        experience: reqExperience,
        certifications: reqCerts,
        other_requirements: reqOther,
      });
      notifications.show({
        title: "Saved",
        message: "Requirements updated",
        color: "green",
      });
      await refreshProfile();
    } catch (e: any) {
      notifications.show({
        title: "Error",
        message: e.response?.data?.message || "Failed to save requirements",
        color: "red",
      });
    } finally {
      setSaving(false);
    }
  };

  /* ─── Initial loading state ─── */
  if (initialLoading && !hasLoaded.current) {
    return (
      <Center p="xl">
        <Loader />
      </Center>
    );
  }

  if (!profile) {
    return (
      <Center p="xl">
        <Stack align="center" gap="md">
          <Text c="dimmed">Job profile not found</Text>
          <Button
            variant="light"
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => navigate("/job-profiles")}
          >
            Back to Profiles
          </Button>
        </Stack>
      </Center>
    );
  }

  /* ─── Render ─── */
  return (
    <Stack gap="lg">
      <Group>
        <ActionIcon variant="subtle" onClick={() => navigate("/job-profiles")}>
          <IconArrowLeft size={20} />
        </ActionIcon>
        <Box>
          <Title order={2} fw={800}>
            {profile.job_title}
          </Title>
          <Text size="sm" c="dimmed">
            {profile.division}
            {profile.job_family ? ` · ${profile.job_family}` : ""}
            {profile.job_location ? ` · ${profile.job_location}` : ""}
          </Text>
        </Box>
        <Badge
          ml="auto"
          variant="light"
          color={statusColors[profile.status] || "gray"}
        >
          {profile.status}
        </Badge>
        {saving && <Loader size="xs" ml="sm" />}
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
                {profile.competencies?.length || 0}
              </Badge>
            </Tabs.Tab>
            <Tabs.Tab value="skills" leftSection={<IconTool size={14} />}>
              Skills{" "}
              <Badge size="xs" variant="light" color="teal" ml={4}>
                {profile.skills?.length || 0}
              </Badge>
            </Tabs.Tab>
            <Tabs.Tab
              value="deliverables"
              leftSection={<IconChecklist size={14} />}
            >
              Deliverables{" "}
              <Badge size="xs" variant="light" color="orange" ml={4}>
                {profile.deliverables?.length || 0}
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
                  data={allProfiles.map((p) => ({
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
                Select competencies from your organisation's framework. Check to
                link, set the required proficiency level, and mark as critical
                or differentiating.
              </Text>

              {(() => {
                // Group competencies by type, then by cluster
                const types = new Map<
                  number,
                  { name: string; comps: JpCompetency[] }
                >();
                allCompetencies.forEach((c) => {
                  const typeId = c.jp_competency_type_id || 0;
                  const typeName = c.competencyType?.competency_type || "Other";
                  if (!types.has(typeId))
                    types.set(typeId, { name: typeName, comps: [] });
                  types.get(typeId)!.comps.push(c);
                });

                const linkedMap = new Map<number, JPCompetencyLink>();
                (profile.competencies || []).forEach((jpc) =>
                  linkedMap.set(jpc.jp_competency_id, jpc),
                );

                if (allCompetencies.length === 0) {
                  return (
                    <Text c="dimmed" size="sm" ta="center" py="lg">
                      No competencies available. Add competencies in the
                      Competency Table first.
                    </Text>
                  );
                }

                return Array.from(types.entries()).map(
                  ([typeId, { name: typeName, comps }]) => {
                    // Group by cluster within this type
                    const clusters = new Map<string, JpCompetency[]>();
                    comps.forEach((c) => {
                      const clusterName =
                        c.competencyCluster?.cluster_name || "Unclustered";
                      if (!clusters.has(clusterName))
                        clusters.set(clusterName, []);
                      clusters.get(clusterName)!.push(c);
                    });

                    const linkedInType = comps.filter((c) =>
                      linkedMap.has(c.jp_competency_id),
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
                                    comp.jp_competency_id,
                                  );
                                  const isSelected = !!linked;
                                  return (
                                    <Paper
                                      key={comp.jp_competency_id}
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
                                            if (!profile) return;
                                            setSaving(true);
                                            try {
                                              if (isSelected) {
                                                await handleRemoveCompetency(
                                                  comp.jp_competency_id,
                                                );
                                              } else {
                                                await api.post(
                                                  `/job-profiles/${profile.job_profile_id}/competencies`,
                                                  {
                                                    jp_competency_id:
                                                      comp.jp_competency_id,
                                                    level: 3,
                                                    is_critical: false,
                                                    is_differentiating: false,
                                                  },
                                                );
                                                await refreshProfile();
                                              }
                                            } catch {
                                              notifications.show({
                                                title: "Error",
                                                message:
                                                  "Failed to update competency",
                                                color: "red",
                                              });
                                            } finally {
                                              setSaving(false);
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
                                                    comp.jp_competency_id,
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

              {profile.skills && profile.skills.length > 0 ? (
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
                    {profile.skills.map((s) => (
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
                  No skills defined yet
                </Text>
              )}
            </Stack>
          </Tabs.Panel>

          {/* ─── Deliverables Tab ─── */}
          <Tabs.Panel value="deliverables" pt="md">
            <Stack>
              <Text size="sm" c="dimmed">
                List the key deliverables for this role.
              </Text>

              <Paper withBorder p="sm" radius="md">
                <Group align="end">
                  <TextInput
                    label="Deliverable"
                    placeholder="e.g., Monthly performance reports"
                    value={addDeliverable}
                    onChange={(e) => setAddDeliverable(e.currentTarget.value)}
                    style={{ flex: 1 }}
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

              {profile.deliverables && profile.deliverables.length > 0 ? (
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th w={50}>#</Table.Th>
                      <Table.Th>Deliverable</Table.Th>
                      <Table.Th w={60} />
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {profile.deliverables
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
