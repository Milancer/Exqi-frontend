import api from "../api";
import type { JobProfile, JpCompetency } from "./interfaces";

/* ── Profiles ── */
export async function getJobProfiles(): Promise<JobProfile[]> {
  const res = await api.get("/job-profiles");
  return res.data;
}

export async function getJobProfile(id: number): Promise<JobProfile> {
  const res = await api.get(`/job-profiles/${id}`);
  return res.data;
}

export async function createJobProfile(
  data: Partial<JobProfile>,
): Promise<JobProfile> {
  const res = await api.post("/job-profiles", data);
  return res.data;
}

export async function updateJobProfile(
  id: number,
  data: Partial<JobProfile>,
): Promise<JobProfile> {
  const res = await api.patch(`/job-profiles/${id}`, data);
  return res.data;
}

export async function deleteJobProfile(id: number): Promise<void> {
  await api.delete(`/job-profiles/${id}`);
}

/* ── Competency items (for picker) ── */
export async function getCompetencyItems(): Promise<JpCompetency[]> {
  const res = await api.get("/job-profiles/competency-items");
  return res.data;
}

/* ── Profile competencies ── */
export async function addCompetency(
  profileId: number,
  data: {
    jp_competency_id: number;
    level: number;
    is_critical: boolean;
    is_differentiating: boolean;
  },
): Promise<void> {
  await api.post(`/job-profiles/${profileId}/competencies`, data);
}

export async function removeCompetency(
  profileId: number,
  competencyId: number,
): Promise<void> {
  await api.delete(`/job-profiles/${profileId}/competencies/${competencyId}`);
}

/* ── Profile skills ── */
export async function addSkill(
  profileId: number,
  data: { skill_name: string; level: number; is_critical: boolean },
): Promise<void> {
  await api.post(`/job-profiles/${profileId}/skills`, data);
}

export async function removeSkill(
  profileId: number,
  skillId: number,
): Promise<void> {
  await api.delete(`/job-profiles/${profileId}/skills/${skillId}`);
}

/* ── Profile deliverables ── */
export async function addDeliverable(
  profileId: number,
  data: { deliverable: string; sequence: number },
): Promise<void> {
  await api.post(`/job-profiles/${profileId}/deliverables`, data);
}

export async function removeDeliverable(
  profileId: number,
  deliverableId: number,
): Promise<void> {
  await api.delete(`/job-profiles/${profileId}/deliverables/${deliverableId}`);
}

/* ── Approvers ── */
export async function assignApprovers(
  profileId: number,
  approverIds: number[],
): Promise<JobProfile> {
  const res = await api.post(`/job-profiles/${profileId}/assign-approvers`, {
    approver_ids: approverIds,
  });
  return res.data;
}

export async function approverAction(
  profileId: number,
  action: "approve" | "reject",
): Promise<JobProfile> {
  const res = await api.post(`/job-profiles/${profileId}/approver-action`, {
    action,
  });
  return res.data;
}

/* ── Profile requirements ── */
export async function updateRequirements(
  profileId: number,
  data: {
    education: string;
    experience: string;
    certifications: string;
    other_requirements: string;
  },
): Promise<void> {
  await api.patch(`/job-profiles/${profileId}/requirements`, data);
}
