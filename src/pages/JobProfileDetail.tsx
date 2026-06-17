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
  MultiSelect,
  Timeline,
  Code,
  ScrollArea,
  Loader,
  Center,
  Modal,
  ThemeIcon,
  Alert,
  Image,
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
  IconEdit,
  IconShieldCheck,
  IconSitemap,
  IconHistory,
  IconEye,
  IconCheck,
  IconX,
  IconSend,
  IconInfoCircle,
} from "@tabler/icons-react";
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";

import type {
  JobProfile,
  JpCompetency,
  JPCompetencyLink,
  JPReviewer,
  BusinessProcessNode,
} from "../services/job-profiles/interfaces";
import {
  getBusinessProcessGroups,
  getBusinessProcessTree,
} from "../services/business-processes";
import { compareCompetencyTypeName } from "../lib/competencyTypeOrder";

const statusColors: Record<string, string> = {
  "In Progress": "blue",
  "Awaiting Review": "orange",
  "Awaiting Approval": "yellow",
  Approved: "teal",
  Deleted: "red",
};

/* ═══════════════════════════════════════════════════════════════════
   JOB PROFILE DETAIL PAGE
   ═══════════════════════════════════════════════════════════════════ */

/**
 * Skill indicators are stored as a JSON column. Depending on driver/serialization
 * they can come back as a real array, a JSON-encoded string, or null.
 */
function parseIndicators(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.map(String);
      return [String(parsed)];
    } catch {
      // Not JSON — treat as a single indicator
      return [trimmed];
    }
  }
  return [];
}

export default function JobProfileDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const profileId = Number(id);

  /* ─── State ─── */
  const [profile, setProfile] = useState<JobProfile | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const hasLoaded = useRef(false);
  const [activeTab, setActiveTab] = useState<string | null>("description");

  // Reference data (all JP competencies for the competency picker)
  const [allCompetencies, setAllCompetencies] = useState<JpCompetency[]>([]);

  // Lightweight profile options for the "Reports To" dropdown
  const [profileOptions, setProfileOptions] = useState<{ value: number; label: string }[]>([]);

  // Reference data for dropdowns
  const [departments, setDepartments] = useState<{ value: string; label: string }[]>([]);
  const [jobGrades, setJobGrades] = useState<{ value: string; label: string }[]>([]);
  const [workLevels, setWorkLevels] = useState<{ value: string; label: string }[]>([]);

  // Skills
  const [addSkillName, setAddSkillName] = useState("");
  const [addSkillLevel, setAddSkillLevel] = useState<number>(3);
  const [addSkillCritical, setAddSkillCritical] = useState(false);

  // Deliverables — full KPA/KPIs/Responsibilities editor
  const [deliverableModalOpen, setDeliverableModalOpen] = useState(false);
  const [editingDeliverableId, setEditingDeliverableId] = useState<number | null>(null);
  const [deliverableKpa, setDeliverableKpa] = useState("");
  const [deliverableKpis, setDeliverableKpis] = useState("");
  const [deliverableResponsibilities, setDeliverableResponsibilities] = useState("");

  // Requirements
  const [reqEducation, setReqEducation] = useState("");
  const [reqExperience, setReqExperience] = useState("");
  const [reqCerts, setReqCerts] = useState("");
  const [reqOther, setReqOther] = useState("");
  // Structured requirements (aligned with old EXQI)
  const [reqMinQual, setReqMinQual] = useState("");
  const [reqPrefQual, setReqPrefQual] = useState("");
  const [reqProfBody, setReqProfBody] = useState("");
  const [reqKnowledge, setReqKnowledge] = useState("");

  // Two-step Review → Approval
  const [reviewerCandidates, setReviewerCandidates] = useState<JPReviewer[]>([]);
  const [approverCandidates, setApproverCandidates] = useState<JPReviewer[]>([]);
  const [selectedReviewerId, setSelectedReviewerId] = useState<string | null>(null);
  const [selectedApproverId, setSelectedApproverId] = useState<string | null>(null);
  const [selectedReviewerEmail, setSelectedReviewerEmail] = useState("");
  const [selectedApproverEmail, setSelectedApproverEmail] = useState("");
  const [reviewConfirmOpen, setReviewConfirmOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject">("approve");
  const [reviewActionType, setReviewActionType] = useState<"reviewer" | "approver">("reviewer");

  /* ─── Business Process picker (item 4.2) ─── */
  const [bpGroups, setBpGroups] = useState<BusinessProcessNode[]>([]);
  // Cached subtree per group code; keyed by group.code (e.g. "Enterprise")
  const [bpTreeByGroup, setBpTreeByGroup] = useState<Record<string, BusinessProcessNode[]>>({});
  const [bpSelectedGroup, setBpSelectedGroup] = useState<string | null>(null);
  const [bpSelectedProcessIds, setBpSelectedProcessIds] = useState<number[]>([]);
  const [bpSelectedSubProcessIds, setBpSelectedSubProcessIds] = useState<number[]>([]);
  const [bpSelectedProcedureIds, setBpSelectedProcedureIds] = useState<number[]>([]);
  const [bpSaving, setBpSaving] = useState(false);
  /** RACI flags per node id. Keyed by business_process_node_id. */
  type RaciFlags = {
    R: boolean;
    A: boolean;
    C: boolean;
    I: boolean;
  };
  const [bpRaci, setBpRaci] = useState<Record<number, RaciFlags>>({});

  /* ─── Audit log / history (item 1.5) ─── */
  type JobProfileAuditEntry = {
    id: number;
    event_type: string;
    summary: string | null;
    comment: string | null;
    changes: Array<{ field: string; old: unknown; new: unknown }> | null;
    snapshot: Record<string, unknown> | null;
    created_at: string;
    user?: { id: number; name?: string; surname?: string; email?: string } | null;
  };
  const [auditEntries, setAuditEntries] = useState<JobProfileAuditEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [snapshotOpen, setSnapshotOpen] = useState(false);
  const [snapshotEntry, setSnapshotEntry] = useState<JobProfileAuditEntry | null>(null);

  /* ─── Hydrate BP selection whenever profile loads / refreshes ─── */
  useEffect(() => {
    if (!profile?.businessProcesses) {
      setBpSelectedProcessIds([]);
      setBpSelectedSubProcessIds([]);
      setBpSelectedProcedureIds([]);
      setBpRaci({});
      return;
    }
    const procIds: number[] = [];
    const subProcIds: number[] = [];
    const procedureIds: number[] = [];
    const raci: Record<number, RaciFlags> = {};
    let firstGroup: string | null = null;
    for (const j of profile.businessProcesses) {
      const node = j.node;
      if (!node) continue;
      if (node.level === 'process') procIds.push(node.id);
      else if (node.level === 'sub_process') subProcIds.push(node.id);
      else if (node.level === 'procedure') procedureIds.push(node.id);
      raci[node.id] = {
        R: !!j.is_responsible,
        A: !!j.is_accountable,
        C: !!j.is_consulted,
        I: !!j.is_informed,
      };
      // Derive Group from the code prefix on first hit
      if (!firstGroup) {
        const c = (node.code || '').charAt(0);
        firstGroup = c === 'M' ? 'Enterprise' : c === 'C' ? 'Core' : c === 'S' ? 'Support' : null;
      }
    }
    setBpSelectedProcessIds(procIds);
    setBpSelectedSubProcessIds(subProcIds);
    setBpSelectedProcedureIds(procedureIds);
    setBpRaci(raci);
    if (firstGroup) setBpSelectedGroup(firstGroup);
  }, [profile?.job_profile_id, profile?.businessProcesses]);

  /* ─── On Group change, fetch (and cache) the subtree ─── */
  useEffect(() => {
    if (!bpSelectedGroup) return;
    if (bpTreeByGroup[bpSelectedGroup]) return;
    let cancelled = false;
    (async () => {
      try {
        const trees = await getBusinessProcessTree(bpSelectedGroup);
        if (cancelled) return;
        setBpTreeByGroup((prev) => ({ ...prev, [bpSelectedGroup]: trees }));
      } catch {
        /* silent */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bpSelectedGroup]);

  /* ─── Audit log fetch — runs whenever the user opens the History tab ─── */
  useEffect(() => {
    if (activeTab !== 'history' || !profileId) return;
    let cancelled = false;
    setAuditLoading(true);
    api
      .get(`/job-profiles/${profileId}/audit-log`)
      .then((res) => {
        if (!cancelled) setAuditEntries(res.data || []);
      })
      .catch(() => {
        if (!cancelled) setAuditEntries([]);
      })
      .finally(() => {
        if (!cancelled) setAuditLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeTab, profileId, profile?.updated]);

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
      status: "In Progress",
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

  const fetchProfileOptions = useCallback(async () => {
    try {
      const res = await api.get("/job-profiles/dropdown-options");
      setProfileOptions(res.data || []);
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

  const fetchCandidates = useCallback(async () => {
    try {
      const [reviewerRes, approverRes] = await Promise.all([
        api.get("/job-profiles/reviewer-candidates"),
        api.get("/job-profiles/approver-candidates"),
      ]);
      setReviewerCandidates(reviewerRes.data);
      setApproverCandidates(approverRes.data);
    } catch {
      /* silent */
    }
  }, []);

  // The full profile is needed by every tab (titles, badges, status indicator
  // etc render in the page header), so it loads on mount. Reference data for
  // each tab is loaded lazily — see the tab-activation effect below.
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Per-tab "have we loaded this tab's reference data yet?" guards.
  // Refs (not state) so flipping them doesn't trigger a re-render.
  const loadedDescriptionRef = useRef(false);
  const loadedCompetenciesRef = useRef(false);
  const loadedApprovalRef = useRef(false);
  const loadedBusinessProcessRef = useRef(false);

  // Lazy-load each tab's reference data the first time the user opens it.
  // Subsequent activations of the same tab are free.
  useEffect(() => {
    if (activeTab === "description" && !loadedDescriptionRef.current) {
      loadedDescriptionRef.current = true;
      fetchProfileOptions();
      fetchReferenceData();
    } else if (
      activeTab === "competencies" &&
      !loadedCompetenciesRef.current
    ) {
      loadedCompetenciesRef.current = true;
      fetchCompetencies();
    } else if (activeTab === "approval" && !loadedApprovalRef.current) {
      loadedApprovalRef.current = true;
      fetchCandidates();
    } else if (
      activeTab === "business-process" &&
      !loadedBusinessProcessRef.current
    ) {
      loadedBusinessProcessRef.current = true;
      let cancelled = false;
      (async () => {
        try {
          const groups = await getBusinessProcessGroups();
          if (!cancelled) setBpGroups(groups);
        } catch {
          /* silent — BP catalogue may not be seeded yet */
        }
      })();
      return () => {
        cancelled = true;
      };
    }
  }, [
    activeTab,
    fetchProfileOptions,
    fetchReferenceData,
    fetchCompetencies,
    fetchCandidates,
  ]);

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
        status: profile.status || "In Progress",
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
      setReqMinQual(r.minimum_qualification || "");
      setReqPrefQual(r.preferred_qualification || "");
      setReqProfBody(r.professional_body_registration || "");
      setReqKnowledge(r.knowledge || "");
    } else {
      setReqEducation("");
      setReqExperience("");
      setReqCerts("");
      setReqOther("");
      setReqMinQual("");
      setReqPrefQual("");
      setReqProfBody("");
      setReqKnowledge("");
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

  const handleUpdateCompetency = async (
    competencyId: number,
    data: { level?: number; is_critical?: boolean; is_differentiating?: boolean },
  ) => {
    if (!profile) return;
    try {
      await api.patch(
        `/job-profiles/${profile.job_profile_id}/competencies/${competencyId}`,
        data,
      );
      await refreshProfile();
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to update competency",
        color: "red",
      });
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
  const openAddDeliverable = () => {
    setEditingDeliverableId(null);
    setDeliverableKpa("");
    setDeliverableKpis("");
    setDeliverableResponsibilities("");
    setDeliverableModalOpen(true);
  };

  const openEditDeliverable = (d: {
    job_profile_deliverable_id: number;
    kpa?: string | null;
    kpis?: string | null;
    responsibilities?: string | null;
    deliverable?: string;
  }) => {
    setEditingDeliverableId(d.job_profile_deliverable_id);
    setDeliverableKpa(d.kpa || d.deliverable || "");
    setDeliverableKpis(d.kpis || "");
    setDeliverableResponsibilities(d.responsibilities || "");
    setDeliverableModalOpen(true);
  };

  const handleSaveDeliverable = async () => {
    if (!profile) return;
    const kpa = deliverableKpa.trim();
    if (!kpa) {
      notifications.show({
        title: "KPA is required",
        message: "Enter a Key Performance Area before saving.",
        color: "orange",
      });
      return;
    }
    try {
      setSaving(true);
      const payload = {
        kpa,
        kpis: deliverableKpis || "",
        responsibilities: deliverableResponsibilities || "",
        // `deliverable` (NOT NULL legacy column) mirrors the KPA
        deliverable: kpa,
      };
      if (editingDeliverableId) {
        await api.patch(
          `/job-profiles/${profile.job_profile_id}/deliverables/${editingDeliverableId}`,
          payload,
        );
        notifications.show({
          title: "Updated",
          message: "Deliverable updated",
          color: "green",
        });
      } else {
        const seq = (profile.deliverables?.length || 0) + 1;
        await api.post(`/job-profiles/${profile.job_profile_id}/deliverables`, {
          ...payload,
          sequence: seq,
        });
        notifications.show({
          title: "Added",
          message: "Deliverable added",
          color: "green",
        });
      }
      setDeliverableModalOpen(false);
      setEditingDeliverableId(null);
      setDeliverableKpa("");
      setDeliverableKpis("");
      setDeliverableResponsibilities("");
      await refreshProfile();
    } catch (e: any) {
      notifications.show({
        title: "Error",
        message: e.response?.data?.message || "Failed to save deliverable",
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
        minimum_qualification: reqMinQual,
        preferred_qualification: reqPrefQual,
        professional_body_registration: reqProfBody,
        knowledge: reqKnowledge,
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

  // Reviewer / Approval handlers
  const handleSubmitForReview = async () => {
    if (!profile) return;
    const reviewerProvided = selectedReviewerId || selectedReviewerEmail.trim();
    const approverProvided = selectedApproverId || selectedApproverEmail.trim();
    if (!reviewerProvided || !approverProvided) return;
    try {
      setSaving(true);
      const payload: Record<string, unknown> = {};
      if (selectedReviewerId) payload.reviewer_id = Number(selectedReviewerId);
      else payload.reviewer_email = selectedReviewerEmail.trim();
      if (selectedApproverId) payload.approver_id = Number(selectedApproverId);
      else payload.approver_email = selectedApproverEmail.trim();
      await api.post(
        `/job-profiles/${profile.job_profile_id}/submit-for-review`,
        payload,
      );
      notifications.show({
        title: "Submitted for Review",
        message: "The reviewer has been notified",
        color: "green",
      });
      setSelectedReviewerId(null);
      setSelectedApproverId(null);
      setSelectedReviewerEmail("");
      setSelectedApproverEmail("");
      await refreshProfile();
    } catch (e: any) {
      notifications.show({
        title: "Error",
        message: e.response?.data?.message || "Failed to submit for review",
        color: "red",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReviewAction = async () => {
    if (!profile) return;
    try {
      setSaving(true);
      const endpoint =
        reviewActionType === "reviewer" ? "reviewer-action" : "approver-action";
      await api.post(`/job-profiles/${profile.job_profile_id}/${endpoint}`, {
        action: reviewAction,
      });
      notifications.show({
        title: reviewAction === "approve" ? "Approved" : "Rejected",
        message:
          reviewAction === "approve"
            ? "You have approved this job profile"
            : "You have rejected this job profile",
        color: reviewAction === "approve" ? "green" : "orange",
      });
      setReviewConfirmOpen(false);
      await refreshProfile();
    } catch (e: any) {
      notifications.show({
        title: "Error",
        message: e.response?.data?.message || "Failed to process action",
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
              value="requirements"
              leftSection={<IconSchool size={14} />}
            >
              Requirements
            </Tabs.Tab>
            <Tabs.Tab
              value="business-process"
              leftSection={<IconSitemap size={14} />}
            >
              Business Process{" "}
              <Badge size="xs" variant="light" color="grape" ml={4}>
                {(profile.businessProcesses?.length) || 0}
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
              value="approval"
              leftSection={<IconShieldCheck size={14} />}
            >
              Approval
              {(profile.status === "Awaiting Review" || profile.status === "Awaiting Approval") && (
                <Badge size="xs" variant="filled" color={profile.status === "Awaiting Review" ? "orange" : "yellow"} ml={4}>
                  !
                </Badge>
              )}
            </Tabs.Tab>
            <Tabs.Tab
              value="history"
              leftSection={<IconHistory size={14} />}
            >
              History
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
              </Group>
              <Group grow>
                <Select
                  label="Reports To"
                  placeholder="Select manager profile"
                  data={profileOptions.map((p) => ({
                    value: String(p.value),
                    label: p.label,
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
                  description="Status changes via the Approval workflow, not manually"
                  disabled
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

                // Display competency-type groups in the canonical business
                // order: Leadership → Behavioural → Technical, then others A–Z.
                return Array.from(types.entries())
                  .sort((a, b) =>
                    compareCompetencyTypeName(a[1].name, b[1].name),
                  )
                  .map(([typeId, { name: typeName, comps }]) => {
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
                                              onChange={(v) => {
                                                if (v)
                                                  handleUpdateCompetency(
                                                    comp.jp_competency_id,
                                                    { level: Number(v) },
                                                  );
                                              }}
                                            />
                                            <Badge
                                              size="xs"
                                              color={
                                                linked!.is_critical
                                                  ? "red"
                                                  : "gray"
                                              }
                                              variant="light"
                                              style={{ cursor: "pointer" }}
                                              onClick={() =>
                                                handleUpdateCompetency(
                                                  comp.jp_competency_id,
                                                  {
                                                    is_critical:
                                                      !linked!.is_critical,
                                                  },
                                                )
                                              }
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
                                              style={{ cursor: "pointer" }}
                                              onClick={() =>
                                                handleUpdateCompetency(
                                                  comp.jp_competency_id,
                                                  {
                                                    is_differentiating:
                                                      !linked!.is_differentiating,
                                                  },
                                                )
                                              }
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
                      <Table.Th>Description</Table.Th>
                      <Table.Th>Indicators</Table.Th>
                      <Table.Th>Level</Table.Th>
                      <Table.Th>Critical</Table.Th>
                      <Table.Th />
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {profile.skills.map((s) => {
                      const indicators = parseIndicators(s.skill?.indicators);
                      return (
                        <Table.Tr key={s.job_profile_skill_id}>
                          <Table.Td>
                            <Text size="sm" fw={500}>
                              {s.skill_name || s.skill?.skill || "-"}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="xs" c="dimmed">
                              {s.skill?.description || "—"}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            {indicators.length > 0 ? (
                              <Stack gap={2}>
                                {indicators.map((ind, i) => (
                                  <Text key={i} size="xs" c="dimmed">
                                    • {ind}
                                  </Text>
                                ))}
                              </Stack>
                            ) : (
                              <Text size="xs" c="dimmed">
                                —
                              </Text>
                            )}
                          </Table.Td>
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
                      );
                    })}
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

              <Group justify="flex-end">
                <Button
                  leftSection={<IconPlus size={14} />}
                  onClick={openAddDeliverable}
                  variant="light"
                >
                  Add Deliverable
                </Button>
              </Group>

              {profile.deliverables && profile.deliverables.length > 0 ? (
                <Stack gap="sm">
                  {profile.deliverables
                    .slice()
                    .sort((a, b) => a.sequence - b.sequence)
                    .map((d) => {
                      const hasStructured = !!(d.kpa || d.kpis || d.responsibilities);
                      const kpiLines = (d.kpis || "")
                        .split("\n")
                        .map((l) => l.trim())
                        .filter(Boolean);
                      const respLines = (d.responsibilities || "")
                        .split("\n")
                        .map((l) => l.trim())
                        .filter(Boolean);
                      return (
                        <Paper
                          key={d.job_profile_deliverable_id}
                          withBorder
                          p="md"
                          radius="md"
                        >
                          <Group justify="flex-end" mb="xs" gap={4}>
                            <Tooltip label="Edit">
                              <ActionIcon
                                variant="subtle"
                                color="blue"
                                onClick={() => openEditDeliverable(d)}
                              >
                                <IconEdit size={14} />
                              </ActionIcon>
                            </Tooltip>
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
                          </Group>

                          {hasStructured ? (
                            <Stack gap="xs">
                              {d.kpa && (
                                <Box>
                                  <Text size="xs" c="dimmed" fw={600} tt="uppercase">
                                    KPA
                                  </Text>
                                  <Text size="sm">{d.kpa}</Text>
                                </Box>
                              )}
                              {kpiLines.length > 0 && (
                                <Box>
                                  <Text size="xs" c="dimmed" fw={600} tt="uppercase">
                                    KPIs
                                  </Text>
                                  <Stack gap={2}>
                                    {kpiLines.map((line, i) => (
                                      <Text key={i} size="sm">
                                        • {line}
                                      </Text>
                                    ))}
                                  </Stack>
                                </Box>
                              )}
                              {respLines.length > 0 && (
                                <Box>
                                  <Text size="xs" c="dimmed" fw={600} tt="uppercase">
                                    Responsibilities
                                  </Text>
                                  <Stack gap={2}>
                                    {respLines.map((line, i) => (
                                      <Text key={i} size="sm">
                                        • {line}
                                      </Text>
                                    ))}
                                  </Stack>
                                </Box>
                              )}
                            </Stack>
                          ) : (
                            <Text size="sm">{d.deliverable}</Text>
                          )}
                        </Paper>
                      );
                    })}
                </Stack>
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
                Define qualifications, experience, certifications, and knowledge required for this role.
              </Text>
              <Textarea
                label="Minimum Qualification"
                placeholder="e.g., Bachelor's degree in Computer Science"
                value={reqMinQual}
                onChange={(e) => setReqMinQual(e.currentTarget.value)}
                minRows={2}
                autosize
              />
              <Textarea
                label="Preferred Qualification"
                placeholder="e.g., Master's in Engineering"
                value={reqPrefQual}
                onChange={(e) => setReqPrefQual(e.currentTarget.value)}
                minRows={2}
                autosize
              />
              <Textarea
                label="Work Experience"
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
                label="Professional Body Registration"
                placeholder="e.g., Registered with ECSA"
                value={reqProfBody}
                onChange={(e) => setReqProfBody(e.currentTarget.value)}
                minRows={2}
                autosize
              />
              <Textarea
                label="Knowledge"
                placeholder="e.g., Knowledge of cloud architecture, agile methodologies"
                value={reqKnowledge}
                onChange={(e) => setReqKnowledge(e.currentTarget.value)}
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

          {/* ─── Business Process Tab (item 4.2) ─── */}
          <Tabs.Panel value="business-process" pt="md">
            <Stack>
              <Text size="sm" c="dimmed">
                Map this Job Profile to one or more SITA Business Processes.
                Pick the Group first, then any combination of Process,
                Sub-Process and Procedure that applies. Selections persist on
                Save.
              </Text>

              <Group grow>
                <Select
                  label="Group"
                  placeholder="Pick a Group"
                  data={bpGroups.map((g) => ({ value: g.code, label: g.name }))}
                  value={bpSelectedGroup}
                  onChange={(v) => {
                    setBpSelectedGroup(v);
                    // Clear lower-level selections when Group changes
                    setBpSelectedProcessIds([]);
                    setBpSelectedSubProcessIds([]);
                    setBpSelectedProcedureIds([]);
                  }}
                  clearable
                  searchable
                />
              </Group>

              {(() => {
                const groupTree = bpSelectedGroup
                  ? (bpTreeByGroup[bpSelectedGroup]?.[0]?.children ?? [])
                  : [];
                const processOptions = groupTree.map((p) => ({
                  value: String(p.id),
                  label: `${p.code} — ${p.name}`,
                }));
                const allowedSubProcessNodes = groupTree
                  .filter((p) => bpSelectedProcessIds.includes(p.id))
                  .flatMap((p) => p.children ?? []);
                const subProcessOptions = allowedSubProcessNodes.map((sp) => ({
                  value: String(sp.id),
                  label: `${sp.code} — ${sp.name}`,
                }));
                const allowedProcedureNodes = allowedSubProcessNodes
                  .filter((sp) => bpSelectedSubProcessIds.includes(sp.id))
                  .flatMap((sp) => sp.children ?? []);
                const procedureOptions = allowedProcedureNodes.map((pr) => ({
                  value: String(pr.id),
                  label: `${pr.code} — ${pr.name}`,
                }));

                return (
                  <Stack>
                    <MultiSelect
                      label="Process"
                      placeholder={
                        bpSelectedGroup
                          ? "Pick one or more Processes"
                          : "Pick a Group first"
                      }
                      data={processOptions}
                      value={bpSelectedProcessIds.map(String)}
                      onChange={(vals) => {
                        const ids = vals.map(Number);
                        setBpSelectedProcessIds(ids);
                        // Drop any sub/procedure picks whose ancestor was unpicked
                        setBpSelectedSubProcessIds((prev) =>
                          prev.filter((spId) =>
                            groupTree.some(
                              (p) =>
                                ids.includes(p.id) &&
                                (p.children ?? []).some((sp) => sp.id === spId),
                            ),
                          ),
                        );
                        setBpSelectedProcedureIds((prev) =>
                          prev.filter((prId) =>
                            groupTree.some(
                              (p) =>
                                ids.includes(p.id) &&
                                (p.children ?? []).some((sp) =>
                                  (sp.children ?? []).some(
                                    (pr) => pr.id === prId,
                                  ),
                                ),
                            ),
                          ),
                        );
                      }}
                      searchable
                      clearable
                      disabled={!bpSelectedGroup}
                    />

                    <MultiSelect
                      label="Sub-Process"
                      placeholder={
                        bpSelectedProcessIds.length === 0
                          ? "Pick a Process first"
                          : "Pick one or more Sub-Processes"
                      }
                      data={subProcessOptions}
                      value={bpSelectedSubProcessIds.map(String)}
                      onChange={(vals) => {
                        const ids = vals.map(Number);
                        setBpSelectedSubProcessIds(ids);
                        setBpSelectedProcedureIds((prev) =>
                          prev.filter((prId) =>
                            allowedSubProcessNodes.some(
                              (sp) =>
                                ids.includes(sp.id) &&
                                (sp.children ?? []).some(
                                  (pr) => pr.id === prId,
                                ),
                            ),
                          ),
                        );
                      }}
                      searchable
                      clearable
                      disabled={bpSelectedProcessIds.length === 0}
                    />

                    <MultiSelect
                      label="Procedure"
                      placeholder={
                        bpSelectedSubProcessIds.length === 0
                          ? "Pick a Sub-Process first"
                          : "Pick one or more Procedures"
                      }
                      data={procedureOptions}
                      value={bpSelectedProcedureIds.map(String)}
                      onChange={(vals) =>
                        setBpSelectedProcedureIds(vals.map(Number))
                      }
                      searchable
                      clearable
                      disabled={bpSelectedSubProcessIds.length === 0}
                    />
                  </Stack>
                );
              })()}

              {/* ─── RACI matrix for selected nodes ─── */}
              {(() => {
                const groupTree = bpSelectedGroup
                  ? bpTreeByGroup[bpSelectedGroup]?.[0]?.children ?? []
                  : [];
                const allSubProcessNodes = groupTree.flatMap(
                  (p) => p.children ?? [],
                );
                const allProcedureNodes = allSubProcessNodes.flatMap(
                  (sp) => sp.children ?? [],
                );
                type Row = {
                  id: number;
                  level: "Process" | "Sub-Process" | "Procedure";
                  code: string;
                  name: string;
                };
                const rows: Row[] = [
                  ...groupTree
                    .filter((p) => bpSelectedProcessIds.includes(p.id))
                    .map((p) => ({
                      id: p.id,
                      level: "Process" as const,
                      code: p.code,
                      name: p.name,
                    })),
                  ...allSubProcessNodes
                    .filter((sp) => bpSelectedSubProcessIds.includes(sp.id))
                    .map((sp) => ({
                      id: sp.id,
                      level: "Sub-Process" as const,
                      code: sp.code,
                      name: sp.name,
                    })),
                  ...allProcedureNodes
                    .filter((pr) => bpSelectedProcedureIds.includes(pr.id))
                    .map((pr) => ({
                      id: pr.id,
                      level: "Procedure" as const,
                      code: pr.code,
                      name: pr.name,
                    })),
                ];

                if (rows.length === 0) return null;

                const RACI_META: Array<{
                  key: keyof RaciFlags;
                  label: string;
                  color: string;
                }> = [
                  { key: "R", label: "R", color: "blue" },
                  { key: "A", label: "A", color: "red" },
                  { key: "C", label: "C", color: "yellow" },
                  { key: "I", label: "I", color: "gray" },
                ];

                const toggle = (id: number, key: keyof RaciFlags) =>
                  setBpRaci((prev) => {
                    const current = prev[id] ?? {
                      R: false,
                      A: false,
                      C: false,
                      I: false,
                    };
                    return {
                      ...prev,
                      [id]: { ...current, [key]: !current[key] },
                    };
                  });

                return (
                  <Stack gap="xs">
                    <Group gap="xs" align="baseline">
                      <Text fw={700} size="sm">
                        RACI
                      </Text>
                      <Text size="xs" c="dimmed">
                        Tag this Job Profile's role on each selected process.
                        Click a letter to toggle it on/off.
                      </Text>
                    </Group>
                    <Group gap="lg">
                      <Text size="xs" c="dimmed">
                        <Text span fw={700} c="blue">
                          R
                        </Text>{" "}
                        Responsible
                      </Text>
                      <Text size="xs" c="dimmed">
                        <Text span fw={700} c="red">
                          A
                        </Text>{" "}
                        Accountable
                      </Text>
                      <Text size="xs" c="dimmed">
                        <Text span fw={700} c="yellow.8">
                          C
                        </Text>{" "}
                        Consulted
                      </Text>
                      <Text size="xs" c="dimmed">
                        <Text span fw={700} c="gray">
                          I
                        </Text>{" "}
                        Informed
                      </Text>
                    </Group>
                    <Paper withBorder p={0} style={{ overflow: "hidden" }}>
                      <Table verticalSpacing="xs" striped>
                        <Table.Thead>
                          <Table.Tr>
                            <Table.Th style={{ width: 110 }}>Level</Table.Th>
                            <Table.Th style={{ width: 110 }}>Code</Table.Th>
                            <Table.Th>Name</Table.Th>
                            {RACI_META.map((m) => (
                              <Table.Th
                                key={m.key}
                                style={{
                                  width: 48,
                                  textAlign: "center",
                                }}
                              >
                                {m.label}
                              </Table.Th>
                            ))}
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {rows.map((row) => {
                            const flags = bpRaci[row.id] ?? {
                              R: false,
                              A: false,
                              C: false,
                              I: false,
                            };
                            return (
                              <Table.Tr key={row.id}>
                                <Table.Td>
                                  <Badge
                                    size="sm"
                                    variant="light"
                                    color={
                                      row.level === "Process"
                                        ? "indigo"
                                        : row.level === "Sub-Process"
                                          ? "teal"
                                          : "grape"
                                    }
                                  >
                                    {row.level}
                                  </Badge>
                                </Table.Td>
                                <Table.Td>
                                  <Text size="sm" ff="monospace">
                                    {row.code}
                                  </Text>
                                </Table.Td>
                                <Table.Td>
                                  <Text size="sm">{row.name}</Text>
                                </Table.Td>
                                {RACI_META.map((m) => {
                                  const on = flags[m.key];
                                  return (
                                    <Table.Td
                                      key={m.key}
                                      style={{ textAlign: "center" }}
                                    >
                                      <Button
                                        variant={on ? "filled" : "outline"}
                                        color={m.color}
                                        size="compact-xs"
                                        radius="xl"
                                        onClick={() => toggle(row.id, m.key)}
                                        style={{
                                          minWidth: 32,
                                          fontWeight: 700,
                                        }}
                                      >
                                        {m.label}
                                      </Button>
                                    </Table.Td>
                                  );
                                })}
                              </Table.Tr>
                            );
                          })}
                        </Table.Tbody>
                      </Table>
                    </Paper>
                  </Stack>
                );
              })()}

              <Group justify="flex-end">
                <Button
                  loading={bpSaving}
                  variant="gradient"
                  gradient={{ from: "grape", to: "violet", deg: 135 }}
                  onClick={async () => {
                    setBpSaving(true);
                    try {
                      const ids = [
                        ...bpSelectedProcessIds,
                        ...bpSelectedSubProcessIds,
                        ...bpSelectedProcedureIds,
                      ];
                      const business_processes = ids.map((node_id) => {
                        const flags = bpRaci[node_id];
                        return {
                          node_id,
                          is_responsible: !!flags?.R,
                          is_accountable: !!flags?.A,
                          is_consulted: !!flags?.C,
                          is_informed: !!flags?.I,
                        };
                      });
                      await api.patch(`/job-profiles/${profileId}`, {
                        business_processes,
                      });
                      notifications.show({
                        title: "Saved",
                        message: "Business Process selections saved",
                        color: "green",
                      });
                      await refreshProfile();
                    } catch {
                      notifications.show({
                        title: "Error",
                        message: "Failed to save Business Process selections",
                        color: "red",
                      });
                    } finally {
                      setBpSaving(false);
                    }
                  }}
                >
                  Save Business Processes
                </Button>
              </Group>
            </Stack>
          </Tabs.Panel>

          {/* ─── Approval Tab ─── */}
          <Tabs.Panel value="approval" pt="md">
            <Stack>
              <Text size="sm" c="dimmed">
                Two-step workflow: assign a Reviewer (Office Reviewer) and an
                Approver (Office Manager). The reviewer reviews first, then the
                approver gives final approval. Rejection at either step returns
                the profile to In Progress.
              </Text>

              {/* Current status info */}
              <Paper withBorder p="md" radius="md">
                <Group>
                  <ThemeIcon
                    variant="light"
                    size="lg"
                    radius="md"
                    color={statusColors[profile.status] || "gray"}
                  >
                    <IconInfoCircle size={18} />
                  </ThemeIcon>
                  <Box>
                    <Text size="sm" fw={500}>
                      Current Status
                    </Text>
                    <Group gap="xs">
                      <Badge
                        color={statusColors[profile.status] || "gray"}
                        variant="light"
                      >
                        {profile.status}
                      </Badge>
                      {profile.reviewed_at && (
                        <Text size="xs" c="dimmed">
                          Last action:{" "}
                          {new Date(profile.reviewed_at).toLocaleDateString()}
                        </Text>
                      )}
                    </Group>
                  </Box>
                </Group>
              </Paper>

              {/* Reviewer & Approver status table — grouped by round so the
                  full approval history is visible across re-submissions.
                  The latest round is rendered first. */}
              {profile.approvers && profile.approvers.length > 0 && (() => {
                // Group approver rows by round_number. Rows from legacy data
                // (missing round_number) fall back to round 1.
                const byRound = new Map<number, typeof profile.approvers>();
                for (const app of profile.approvers) {
                  const round = app.round_number ?? 1;
                  const bucket = byRound.get(round) ?? [];
                  bucket.push(app);
                  byRound.set(round, bucket);
                }
                const rounds = Array.from(byRound.keys()).sort((a, b) => b - a);
                const latestRound = rounds[0];

                return (
                  <Paper withBorder p="md" radius="md">
                    <Text size="sm" fw={500} mb="sm">
                      Review & Approval Status
                    </Text>
                    <Stack gap="md">
                      {rounds.map((round) => {
                        const rows = (byRound.get(round) ?? [])
                          .slice()
                          .sort((a, _b) => (a.type === "reviewer" ? -1 : 1));
                        // Use the earliest created_at in the round as its submission date
                        const submittedAt = rows
                          .map((r) => r.created_at)
                          .filter(Boolean)
                          .sort()[0];
                        return (
                          <Box key={round}>
                            <Group justify="space-between" mb={4}>
                              <Text size="xs" fw={600} c="dimmed">
                                Round {round}
                                {round === latestRound ? " (current)" : ""}
                              </Text>
                              {submittedAt && (
                                <Text size="xs" c="dimmed">
                                  Submitted {new Date(submittedAt).toLocaleDateString()}
                                </Text>
                              )}
                            </Group>
                            <Table striped highlightOnHover withTableBorder withColumnBorders>
                              <Table.Thead>
                                <Table.Tr>
                                  <Table.Th>Role</Table.Th>
                                  <Table.Th>Name</Table.Th>
                                  <Table.Th>Status</Table.Th>
                                  <Table.Th>Signature</Table.Th>
                                  <Table.Th>Date</Table.Th>
                                </Table.Tr>
                              </Table.Thead>
                              <Table.Tbody>
                                {rows.map((app) => (
                                  <Table.Tr key={app.job_profile_approver_id}>
                                    <Table.Td>
                                      <Badge
                                        size="sm"
                                        variant="light"
                                        color={app.type === "reviewer" ? "cyan" : "blue"}
                                      >
                                        {app.type === "reviewer" ? "Reviewer" : "Approver"}
                                      </Badge>
                                    </Table.Td>
                                    <Table.Td>
                                      <Text size="sm" fw={500}>
                                        {app.approver.name} {app.approver.surname}
                                      </Text>
                                      <Text size="xs" c="dimmed">
                                        {app.approver.email}
                                      </Text>
                                    </Table.Td>
                                    <Table.Td ta="center">
                                      <Badge
                                        size="sm"
                                        color={
                                          app.status === "Approved"
                                            ? "green"
                                            : app.status === "Rejected"
                                              ? "red"
                                              : "yellow"
                                        }
                                      >
                                        {app.status}
                                      </Badge>
                                    </Table.Td>
                                    <Table.Td ta="center">
                                      {app.status === "Approved" && app.approver.signature ? (
                                        <Image
                                          src={app.approver.signature}
                                          alt={`${app.approver.name} signature`}
                                          h={40}
                                          w={120}
                                          fit="contain"
                                        />
                                      ) : app.status === "Approved" ? (
                                        <Text size="xs" c="dimmed" fs="italic">
                                          No signature on file
                                        </Text>
                                      ) : (
                                        <Text size="xs" c="dimmed">—</Text>
                                      )}
                                    </Table.Td>
                                    <Table.Td>
                                      <Text size="sm">
                                        {app.approved_at
                                          ? new Date(app.approved_at).toLocaleDateString()
                                          : "—"}
                                      </Text>
                                    </Table.Td>
                                  </Table.Tr>
                                ))}
                              </Table.Tbody>
                            </Table>
                          </Box>
                        );
                      })}
                    </Stack>
                  </Paper>
                );
              })()}

              {/* Creator view: submit for review (assign reviewer + approver upfront) */}
              {profile.status === "In Progress" && (
                <Paper withBorder p="md" radius="md">
                  <Text size="sm" fw={500} mb="sm">
                    Submit for Review
                  </Text>
                  <Stack gap="md">
                    <Stack gap={4}>
                      <Select
                        label="Reviewer (Office Reviewer)"
                        placeholder="Select an existing reviewer"
                        data={reviewerCandidates.map((r) => ({
                          value: String(r.id),
                          label: `${r.name} ${r.surname} (${r.email})`,
                        }))}
                        value={selectedReviewerId}
                        onChange={(v) => {
                          setSelectedReviewerId(v);
                          if (v) setSelectedReviewerEmail("");
                        }}
                        searchable
                        clearable
                        disabled={!!selectedReviewerEmail}
                      />
                      <Text size="xs" c="dimmed" ta="center">
                        — or —
                      </Text>
                      <TextInput
                        label="Invite a new reviewer by email"
                        placeholder="reviewer@example.com"
                        type="email"
                        value={selectedReviewerEmail}
                        onChange={(e) => {
                          const v = e.currentTarget.value;
                          setSelectedReviewerEmail(v);
                          if (v) setSelectedReviewerId(null);
                        }}
                      />
                    </Stack>

                    <Stack gap={4}>
                      <Select
                        label="Approver (Office Manager)"
                        placeholder="Select an existing approver"
                        data={approverCandidates.map((r) => ({
                          value: String(r.id),
                          label: `${r.name} ${r.surname} (${r.email})`,
                        }))}
                        value={selectedApproverId}
                        onChange={(v) => {
                          setSelectedApproverId(v);
                          if (v) setSelectedApproverEmail("");
                        }}
                        searchable
                        clearable
                        disabled={!!selectedApproverEmail}
                      />
                      <Text size="xs" c="dimmed" ta="center">
                        — or —
                      </Text>
                      <TextInput
                        label="Invite a new approver by email"
                        placeholder="approver@example.com"
                        type="email"
                        value={selectedApproverEmail}
                        onChange={(e) => {
                          const v = e.currentTarget.value;
                          setSelectedApproverEmail(v);
                          if (v) setSelectedApproverId(null);
                        }}
                      />
                    </Stack>

                    <Button
                      leftSection={<IconSend size={16} />}
                      onClick={handleSubmitForReview}
                      disabled={
                        !(selectedReviewerId || selectedReviewerEmail.trim()) ||
                        !(selectedApproverId || selectedApproverEmail.trim())
                      }
                      loading={saving}
                      variant="gradient"
                      gradient={{ from: "grape", to: "violet", deg: 135 }}
                    >
                      Submit for Review
                    </Button>
                  </Stack>
                </Paper>
              )}

              {/* Reviewer action: approve / reject (Awaiting Review, current user is reviewer) */}
              {profile.status === "Awaiting Review" &&
                profile.approvers?.some(
                  (a) =>
                    a.type === "reviewer" &&
                    String(a.approver_id) === String(authUser?.userId) &&
                    a.status === "Pending"
                ) && (
                  <Paper withBorder p="md" radius="md">
                    <Alert
                      variant="light"
                      color="orange"
                      title="Review Required"
                      mb="md"
                    >
                      You have been assigned to review this job profile. Please
                      review all tabs and then approve or reject.
                    </Alert>
                    <Group justify="flex-end">
                      <Button
                        variant="outline"
                        color="red"
                        leftSection={<IconX size={16} />}
                        onClick={() => {
                          setReviewActionType("reviewer");
                          setReviewAction("reject");
                          setReviewConfirmOpen(true);
                        }}
                        loading={saving}
                      >
                        Reject
                      </Button>
                      <Button
                        color="green"
                        leftSection={<IconCheck size={16} />}
                        onClick={() => {
                          setReviewActionType("reviewer");
                          setReviewAction("approve");
                          setReviewConfirmOpen(true);
                        }}
                        loading={saving}
                      >
                        Approve Review
                      </Button>
                    </Group>
                  </Paper>
                )}

              {/* Approver action: approve / reject (Awaiting Approval, current user is approver) */}
              {profile.status === "Awaiting Approval" &&
                profile.approvers?.some(
                  (a) =>
                    a.type === "approver" &&
                    String(a.approver_id) === String(authUser?.userId) &&
                    a.status === "Pending"
                ) && (
                  <Paper withBorder p="md" radius="md">
                    <Alert
                      variant="light"
                      color="yellow"
                      title="Approval Required"
                      mb="md"
                    >
                      This job profile has been reviewed and is awaiting your
                      final approval.
                    </Alert>
                    <Group justify="flex-end">
                      <Button
                        variant="outline"
                        color="red"
                        leftSection={<IconX size={16} />}
                        onClick={() => {
                          setReviewActionType("approver");
                          setReviewAction("reject");
                          setReviewConfirmOpen(true);
                        }}
                        loading={saving}
                      >
                        Reject
                      </Button>
                      <Button
                        color="green"
                        leftSection={<IconCheck size={16} />}
                        onClick={() => {
                          setReviewActionType("approver");
                          setReviewAction("approve");
                          setReviewConfirmOpen(true);
                        }}
                        loading={saving}
                      >
                        Approve
                      </Button>
                    </Group>
                  </Paper>
                )}

              {/* Already acted by this user */}
              {(profile.status === "Awaiting Review" || profile.status === "Awaiting Approval") &&
                profile.approvers?.some(
                  (a) =>
                    String(a.approver_id) === String(authUser?.userId) &&
                    a.status !== "Pending"
                ) && (
                  <Alert variant="light" color="teal" title="Already Submitted">
                    You have already submitted your review for this job profile.
                  </Alert>
                )}

              {/* Waiting state — Awaiting Review (creator / non-participants see this) */}
              {profile.status === "Awaiting Review" &&
                !profile.approvers?.some(
                  (a) => String(a.approver_id) === String(authUser?.userId)
                ) && (
                  <Alert variant="light" color="orange" title="Under Review">
                    This job profile is being reviewed by{" "}
                    {profile.approvers
                      ?.filter((a) => a.type === "reviewer")
                      .map((a) => `${a.approver.name} ${a.approver.surname}`)
                      .join(", ")}
                    . You will be notified when the review is complete.
                  </Alert>
                )}

              {/* Waiting state — Awaiting Approval (creator / non-participants see this) */}
              {profile.status === "Awaiting Approval" &&
                !profile.approvers?.some(
                  (a) =>
                    a.type === "approver" &&
                    String(a.approver_id) === String(authUser?.userId)
                ) && (
                  <Alert variant="light" color="blue" title="Awaiting Approval">
                    This job profile has been reviewed and is awaiting final
                    approval from{" "}
                    {profile.approvers
                      ?.filter((a) => a.type === "approver")
                      .map((a) => `${a.approver.name} ${a.approver.surname}`)
                      .join(", ")}
                    .
                  </Alert>
                )}

              {/* Approved state */}
              {profile.status === "Approved" && (
                <Alert variant="light" color="green" title="Approved">
                  This job profile has been reviewed and approved
                  {profile.reviewed_at && (
                    <>
                      {" "}
                      on {new Date(profile.reviewed_at).toLocaleDateString()}
                    </>
                  )}
                  .
                </Alert>
              )}
            </Stack>
          </Tabs.Panel>

          {/* ─── History / Audit Log Tab (item 1.5) ─── */}
          <Tabs.Panel value="history" pt="md">
            <Stack>
              <Text size="sm" c="dimmed">
                Every state-changing event on this job profile is logged with
                an immutable JSON snapshot. Newest first.
              </Text>

              {auditLoading ? (
                <Center py="xl">
                  <Loader />
                </Center>
              ) : auditEntries.length === 0 ? (
                <Text c="dimmed" size="sm">
                  No audit entries yet.
                </Text>
              ) : (
                <Timeline active={0} bulletSize={20} lineWidth={2}>
                  {auditEntries.map((e) => {
                    const actor = e.user
                      ? `${e.user.name ?? ""} ${e.user.surname ?? ""}`.trim() ||
                        e.user.email ||
                        `user #${e.user.id}`
                      : "system";
                    const eventColors: Record<string, string> = {
                      created: "blue",
                      updated: "indigo",
                      submitted_for_review: "orange",
                      reviewer_approved: "teal",
                      reviewer_rejected: "red",
                      approver_approved: "green",
                      approver_rejected: "red",
                      reverted_to_in_progress: "gray",
                    };
                    return (
                      <Timeline.Item
                        key={e.id}
                        title={
                          <Group gap="xs">
                            <Badge
                              size="sm"
                              variant="light"
                              color={eventColors[e.event_type] || "gray"}
                            >
                              {e.event_type.replace(/_/g, " ")}
                            </Badge>
                            <Text size="sm" fw={500}>
                              {actor}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {new Date(e.created_at).toLocaleString()}
                            </Text>
                          </Group>
                        }
                      >
                        {e.summary && (
                          <Text size="sm" mt={4}>
                            {e.summary}
                          </Text>
                        )}
                        {e.comment && (
                          <Text size="sm" c="dimmed" fs="italic" mt={2}>
                            "{e.comment}"
                          </Text>
                        )}
                        {e.changes && e.changes.length > 0 && (
                          <Box mt={6}>
                            <Text size="xs" c="dimmed" mb={2}>
                              Changes:
                            </Text>
                            <Stack gap={2}>
                              {e.changes.map((c, idx) => (
                                <Text key={idx} size="xs">
                                  <b>{c.field}</b>:{" "}
                                  <Code>{JSON.stringify(c.old)}</Code> →{" "}
                                  <Code>{JSON.stringify(c.new)}</Code>
                                </Text>
                              ))}
                            </Stack>
                          </Box>
                        )}
                        {e.snapshot && (
                          <Group mt={6}>
                            <Button
                              size="xs"
                              variant="default"
                              leftSection={<IconEye size={12} />}
                              onClick={() => {
                                setSnapshotEntry(e);
                                setSnapshotOpen(true);
                              }}
                            >
                              View snapshot
                            </Button>
                          </Group>
                        )}
                      </Timeline.Item>
                    );
                  })}
                </Timeline>
              )}
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </Paper>

      {/* ─── Snapshot viewer Modal ─── */}
      <Modal
        opened={snapshotOpen}
        onClose={() => setSnapshotOpen(false)}
        title={
          snapshotEntry
            ? `Snapshot — ${new Date(snapshotEntry.created_at).toLocaleString()}`
            : "Snapshot"
        }
        size="xl"
        centered
      >
        <ScrollArea h={500}>
          <Code block>
            {JSON.stringify(snapshotEntry?.snapshot ?? {}, null, 2)}
          </Code>
        </ScrollArea>
      </Modal>

      {/* ─── Deliverable Add/Edit modal ─── */}
      <Modal
        opened={deliverableModalOpen}
        onClose={() => setDeliverableModalOpen(false)}
        title={editingDeliverableId ? "Edit Deliverable" : "Add Deliverable"}
        centered
        size="lg"
      >
        <Stack gap="md">
          <TextInput
            label="KPA (Key Performance Area)"
            description="One-line headline for this deliverable"
            placeholder="e.g., Develop and maintain core platform features"
            value={deliverableKpa}
            onChange={(e) => setDeliverableKpa(e.currentTarget.value)}
            required
            autoFocus
          />
          <Textarea
            label="KPIs"
            description="One KPI per line"
            placeholder={"e.g.\nSystem uptime 99.9%\nMean time to recovery < 1h"}
            value={deliverableKpis}
            onChange={(e) => setDeliverableKpis(e.currentTarget.value)}
            minRows={4}
            autosize
          />
          <Textarea
            label="Responsibilities"
            description="One responsibility per line"
            placeholder={"e.g.\nMonitor production health\nRespond to on-call alerts"}
            value={deliverableResponsibilities}
            onChange={(e) => setDeliverableResponsibilities(e.currentTarget.value)}
            minRows={6}
            autosize
          />
          <Group justify="flex-end">
            <Button
              variant="subtle"
              onClick={() => setDeliverableModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveDeliverable}
              loading={saving}
              disabled={!deliverableKpa.trim()}
            >
              {editingDeliverableId ? "Save Changes" : "Add Deliverable"}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* ─── Review confirmation modal ─── */}
      <Modal
        opened={reviewConfirmOpen}
        onClose={() => setReviewConfirmOpen(false)}
        title="Confirm Review Action"
        centered
        size="sm"
      >
        <Stack>
          <Text size="sm">
            Are you sure you want to{" "}
            <strong>{reviewAction === "approve" ? "approve" : "reject"}</strong>{" "}
            this job profile?
          </Text>
          {reviewAction === "reject" && (
            <Text size="xs" c="dimmed">
              Rejecting will return the profile to In Progress status so the creator
              can make changes.
            </Text>
          )}
          <Group justify="flex-end">
            <Button
              variant="subtle"
              onClick={() => setReviewConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              color={reviewAction === "approve" ? "green" : "red"}
              onClick={handleReviewAction}
              loading={saving}
            >
              {reviewAction === "approve" ? "Approve" : "Reject"}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
