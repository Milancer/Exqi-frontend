export interface CompetencyType {
  competency_type_id: number;
  competency_type: string;
  status: string;
  client_id?: number;
}

export interface CompetencyCluster {
  competency_cluster_id: number;
  competency_type_id: number;
  cluster_name: string;
  description: string;
  status: string;
  client_id?: number;
  competencyType?: CompetencyType;
}

export interface Competency {
  competency_id: number;
  competency: string;
  description: string;
  indicators: string;
  competency_type_id: number;
  competency_cluster_id: number;
  status: string;
  client_id?: number;
  competencyType?: CompetencyType;
  competencyCluster?: CompetencyCluster;
}

export interface CompetencyQuestion {
  competency_question_id: number;
  competency_id: number;
  level: number;
  question: string;
  status: string;
  client_id?: number;
  competency?: { competency: string };
}
