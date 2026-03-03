export interface InterviewSession {
  session_id: number;
  candidate_id: number;
  cbi_template_id: number;
  interviewer_id: number;
  token: string;
  status: string;
  expires_at: string;
  completed_at: string | null;
  total_score: number | null;
  max_possible_score: number | null;
  percentage: number | null;
  client_id: number;
  created_at: string;
  candidate?: {
    candidate_id: number;
    name: string;
    surname: string;
    email: string;
    position: string;
  };
  template?: {
    cbi_template_id: number;
    template_name: string;
  };
  interviewer?: {
    id: number;
    name: string;
    surname: string;
    email: string;
  };
}

export interface InterviewResponseItem {
  response_id: number;
  session_id: number;
  question_id: number;
  competency_id: number;
  rating: number;
  notes: string | null;
  behavioral_flags: {
    paste_detected?: boolean;
    time_spent_seconds?: number;
    keystroke_count?: number;
    focus_lost_count?: number;
  } | null;
}

export interface BehavioralData {
  paste_detected: boolean;
  time_spent_seconds: number;
  keystroke_count: number;
  focus_lost_count: number;
}

export interface QuestionResponse {
  question_id: number;
  competency_id: number;
  question_text: string;
  competency_name: string;
  rating: number;
  notes: string;
  behavioral: BehavioralData;
}
