import api from "../api";
import type { InterviewSession, InterviewResponseItem } from "./interfaces";

export async function getInterviews(): Promise<InterviewSession[]> {
  const res = await api.get("/interviews");
  return res.data;
}

export async function getInterview(id: number): Promise<InterviewSession> {
  const res = await api.get(`/interviews/${id}`);
  return res.data;
}

export async function createInterview(data: {
  candidate_id: number;
  cbi_template_id: number;
  interviewer_id: number;
}): Promise<InterviewSession> {
  const res = await api.post("/interviews", data);
  return res.data;
}

export async function cancelInterview(id: number): Promise<void> {
  await api.patch(`/interviews/${id}/cancel`);
}

export async function getInterviewResponses(
  sessionId: number,
): Promise<InterviewResponseItem[]> {
  const res = await api.get(`/interviews/${sessionId}/responses`);
  return res.data;
}

export async function saveScores(
  sessionId: number,
  scores: { response_id: number; rating: number }[],
): Promise<void> {
  await api.patch(`/interviews/${sessionId}/scores`, { scores });
}
