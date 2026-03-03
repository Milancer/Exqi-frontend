import api from "../api";
import type { Candidate } from "./interfaces";

export async function getCandidates(): Promise<Candidate[]> {
  const res = await api.get("/candidates");
  return res.data;
}

export async function createCandidate(
  data: Partial<Candidate>,
): Promise<Candidate> {
  const res = await api.post("/candidates", data);
  return res.data;
}

export async function updateCandidate(
  id: number,
  data: Partial<Candidate>,
): Promise<Candidate> {
  const res = await api.patch(`/candidates/${id}`, data);
  return res.data;
}

export async function deleteCandidate(id: number): Promise<void> {
  await api.delete(`/candidates/${id}`);
}
