export interface CompetencySelection {
  competency_id: number;
  level: number;
}

export interface CbiTemplate {
  cbi_template_id: number;
  template_name: string;
  description: string;
  competencies: CompetencySelection[];
  questions: number[];
  status: string;
}
