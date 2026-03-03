import api from "../api";
import type {
  CompetencyType,
  CompetencyCluster,
  Competency,
  CompetencyQuestion,
} from "./interfaces";

/* ── Types ── */
export async function getCompetencyTypes(): Promise<CompetencyType[]> {
  const res = await api.get("/competencies/types");
  return res.data;
}

export async function createCompetencyType(
  data: Partial<CompetencyType>,
): Promise<CompetencyType> {
  const res = await api.post("/competencies/types", data);
  return res.data;
}

export async function updateCompetencyType(
  id: number,
  data: Partial<CompetencyType>,
): Promise<CompetencyType> {
  const res = await api.patch(`/competencies/types/${id}`, data);
  return res.data;
}

export async function deleteCompetencyType(id: number): Promise<void> {
  await api.delete(`/competencies/types/${id}`);
}

/* ── Clusters ── */
export async function getCompetencyClusters(): Promise<CompetencyCluster[]> {
  const res = await api.get("/competencies/clusters");
  return res.data;
}

export async function createCompetencyCluster(
  data: Partial<CompetencyCluster>,
): Promise<CompetencyCluster> {
  const res = await api.post("/competencies/clusters", data);
  return res.data;
}

export async function updateCompetencyCluster(
  id: number,
  data: Partial<CompetencyCluster>,
): Promise<CompetencyCluster> {
  const res = await api.patch(`/competencies/clusters/${id}`, data);
  return res.data;
}

export async function deleteCompetencyCluster(id: number): Promise<void> {
  await api.delete(`/competencies/clusters/${id}`);
}

/* ── Competencies ── */
export async function getCompetencies(): Promise<Competency[]> {
  const res = await api.get("/competencies");
  return res.data;
}

export async function createCompetency(
  data: Partial<Competency>,
): Promise<Competency> {
  const res = await api.post("/competencies", data);
  return res.data;
}

export async function updateCompetency(
  id: number,
  data: Partial<Competency>,
): Promise<Competency> {
  const res = await api.patch(`/competencies/${id}`, data);
  return res.data;
}

export async function deleteCompetency(id: number): Promise<void> {
  await api.delete(`/competencies/${id}`);
}

/* ── Questions ── */
export async function getQuestions(): Promise<CompetencyQuestion[]> {
  const res = await api.get("/cbi/questions");
  return res.data;
}

export async function createQuestion(
  data: Partial<CompetencyQuestion>,
): Promise<CompetencyQuestion> {
  const res = await api.post("/cbi/questions", data);
  return res.data;
}

export async function updateQuestion(
  id: number,
  data: Partial<CompetencyQuestion>,
): Promise<CompetencyQuestion> {
  const res = await api.patch(`/cbi/questions/${id}`, data);
  return res.data;
}

export async function deleteQuestion(id: number): Promise<void> {
  await api.delete(`/cbi/questions/${id}`);
}
