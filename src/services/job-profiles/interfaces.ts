export interface JpCompetencyType {
  jp_competency_type_id: number;
  competency_type: string;
  status: string;
  client_id?: number;
}

export interface JpCompetencyCluster {
  jp_competency_cluster_id: number;
  cluster_name: string;
  description: string;
  jp_competency_type_id: number;
  status: string;
  client_id?: number;
  competencyType?: JpCompetencyType;
}

export interface JpCompetency {
  jp_competency_id: number;
  competency: string;
  description?: string;
  indicators?: string;
  jp_competency_type_id: number;
  jp_competency_cluster_id: number;
  status: string;
  client_id?: number;
  competencyType?: JpCompetencyType;
  competencyCluster?: JpCompetencyCluster;
}

export interface JPCompetencyLink {
  job_profile_competency_id: number;
  jp_competency_id: number;
  level: number;
  is_critical: boolean;
  is_differentiating: boolean;
  jpCompetency?: JpCompetency;
}

export interface JPSkill {
  job_profile_skill_id: number;
  skill_id?: number;
  skill_name?: string;
  skill?: {
    skill_id: number;
    skill: string;
    description?: string;
    indicators?: string | string[] | null;
  };
  level: number;
  is_critical: boolean;
  status: string;
}

export interface JPDeliverable {
  job_profile_deliverable_id: number;
  deliverable: string;
  sequence: number;
  status: string;
  // Structured fields (aligned with old EXQI)
  kpa?: string | null;
  kpis?: string | null;
  responsibilities?: string | null;
  weight?: number | null;
}

export interface JPRequirement {
  job_profile_requirement_id: number;
  education: string;
  experience: string;
  certifications: string;
  other_requirements: string;
  // Structured fields (aligned with old EXQI)
  minimum_qualification?: string | null;
  preferred_qualification?: string | null;
  professional_body_registration?: string | null;
  knowledge?: string | null;
}

export interface JPReviewer {
  id: number;
  name: string;
  surname: string;
  email: string;
  role: string;
}

export interface JPApprover {
  job_profile_approver_id: number;
  job_profile_id: number;
  approver_id: number;
  type: 'reviewer' | 'approver';
  status: 'Pending' | 'Approved' | 'Rejected';
  round_number: number;
  approved_at: string | null;
  created_at: string;
  approver: {
    id: number;
    name: string;
    surname: string;
    email: string;
    signature: string | null;
  };
}


/* ── Business Process selections (item 4.2) ── */
export type BpLevel = 'group' | 'process' | 'sub_process' | 'procedure';

export interface BusinessProcessNode {
  id: number;
  parent_id: number | null;
  level: BpLevel;
  code: string;
  name: string;
  definition?: string | null;
  sort_order?: number;
  is_active?: boolean;
  children?: BusinessProcessNode[];
}

export interface JPBusinessProcess {
  job_profile_id: number;
  business_process_node_id: number;
  is_responsible?: boolean;
  is_accountable?: boolean;
  is_consulted?: boolean;
  is_informed?: boolean;
  created?: string;
  node?: BusinessProcessNode;
}

export type RaciKey = 'R' | 'A' | 'C' | 'I';

export interface BusinessProcessSelection {
  node_id: number;
  is_responsible?: boolean;
  is_accountable?: boolean;
  is_consulted?: boolean;
  is_informed?: boolean;
}

export interface JobProfile {
  job_profile_id: number;
  job_title: string;
  job_purpose: string;
  division: string;
  job_family: string;
  job_location: string;
  level_of_work: number | null;
  department_id: number | null;
  job_grade_id: number | null;
  jobGrade?: { job_grade_id: number; job_grade: string } | null;
  department?: { department_id: number; department: string } | null;
  workLevel?: { work_level_id: number; level_of_work: string } | null;
  reports_to: number | null;
  status: string;
  client_id?: number;
  client?: { id: number; name: string } | null;
  reviewer_id?: number | null;
  reviewer?: JPReviewer | null;
  reviewed_at?: string | null;
  user_id?: string;
  competencies?: JPCompetencyLink[];
  skills?: JPSkill[];
  deliverables?: JPDeliverable[];
  requirements?: JPRequirement;
  approvers?: JPApprover[];
  businessProcesses?: JPBusinessProcess[];
  business_process_node_ids?: number[];
  created?: string;
  updated?: string;
}
