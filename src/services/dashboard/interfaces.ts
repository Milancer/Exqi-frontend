export interface DashboardStats {
  competencies: number;
  competencyTypes: number;
  questions: number;
  templates: number;
  jobProfiles: number;
  jobProfilesByStatus: { status: string; count: number }[];
  recentProfiles: {
    job_profile_id: number;
    job_title: string;
    status: string;
    division: string;
  }[];
  interviews: {
    total: number;
    pending: number;
    completed: number;
    avgScore: number;
  };
}
