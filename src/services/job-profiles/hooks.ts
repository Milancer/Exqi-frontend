import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as svc from "./services";
import type { JobProfile } from "./interfaces";

const KEYS = {
  all: ["job-profiles"] as const,
  detail: (id: number) => ["job-profiles", id] as const,
  competencyItems: ["job-profile-competency-items"] as const,
};

/* ── Profiles ── */
export function useJobProfiles() {
  return useQuery({ queryKey: KEYS.all, queryFn: svc.getJobProfiles });
}

export function useJobProfile(id: number) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => svc.getJobProfile(id),
    enabled: !!id,
  });
}

export function useCompetencyItems() {
  return useQuery({
    queryKey: KEYS.competencyItems,
    queryFn: svc.getCompetencyItems,
  });
}

export function useCreateJobProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<JobProfile>) => svc.createJobProfile(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}

export function useUpdateJobProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<JobProfile> }) =>
      svc.updateJobProfile(id, data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: KEYS.detail(variables.id) });
    },
  });
}

export function useDeleteJobProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => svc.deleteJobProfile(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}

/* ── Profile competencies ── */
export function useAddCompetency() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      profileId,
      ...data
    }: {
      profileId: number;
      jp_competency_id: number;
      level: number;
      is_critical: boolean;
      is_differentiating: boolean;
    }) => svc.addCompetency(profileId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["job-profiles"] });
    },
  });
}

export function useRemoveCompetency() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      profileId,
      competencyId,
    }: {
      profileId: number;
      competencyId: number;
    }) => svc.removeCompetency(profileId, competencyId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["job-profiles"] });
    },
  });
}

/* ── Profile skills ── */
export function useAddSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      profileId,
      ...data
    }: {
      profileId: number;
      skill_name: string;
      level: number;
      is_critical: boolean;
    }) => svc.addSkill(profileId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["job-profiles"] });
    },
  });
}

export function useRemoveSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      profileId,
      skillId,
    }: {
      profileId: number;
      skillId: number;
    }) => svc.removeSkill(profileId, skillId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["job-profiles"] });
    },
  });
}

/* ── Profile deliverables ── */
export function useAddDeliverable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      profileId,
      ...data
    }: {
      profileId: number;
      deliverable: string;
      sequence: number;
    }) => svc.addDeliverable(profileId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["job-profiles"] });
    },
  });
}

export function useRemoveDeliverable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      profileId,
      deliverableId,
    }: {
      profileId: number;
      deliverableId: number;
    }) => svc.removeDeliverable(profileId, deliverableId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["job-profiles"] });
    },
  });
}

/* ── Profile requirements ── */
export function useUpdateRequirements() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      profileId,
      ...data
    }: {
      profileId: number;
      education: string;
      experience: string;
      certifications: string;
      other_requirements: string;
    }) => svc.updateRequirements(profileId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["job-profiles"] });
    },
  });
}
