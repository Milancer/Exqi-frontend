import api from "../api";
import type {
  JpCompetencyType,
  JpCompetencyCluster,
  JpCompetency,
} from "./interfaces";

/* ── Types ── */
export async function getJpCompetencyTypes(): Promise<JpCompetencyType[]> {
  const res = await api.get("/job-profiles/competency-types");
  return res.data;
}

export async function createJpCompetencyType(
  data: Partial<JpCompetencyType>,
): Promise<JpCompetencyType> {
  const res = await api.post("/job-profiles/competency-types", data);
  return res.data;
}

export async function updateJpCompetencyType(
  id: number,
  data: Partial<JpCompetencyType>,
): Promise<JpCompetencyType> {
  const res = await api.patch(`/job-profiles/competency-types/${id}`, data);
  return res.data;
}

export async function deleteJpCompetencyType(id: number): Promise<void> {
  await api.delete(`/job-profiles/competency-types/${id}`);
}

/* ── Clusters ── */
export async function getJpCompetencyClusters(): Promise<
  JpCompetencyCluster[]
> {
  const res = await api.get("/job-profiles/competency-clusters");
  return res.data;
}

export async function createJpCompetencyCluster(
  data: Partial<JpCompetencyCluster>,
): Promise<JpCompetencyCluster> {
  const res = await api.post("/job-profiles/competency-clusters", data);
  return res.data;
}

export async function updateJpCompetencyCluster(
  id: number,
  data: Partial<JpCompetencyCluster>,
): Promise<JpCompetencyCluster> {
  const res = await api.patch(`/job-profiles/competency-clusters/${id}`, data);
  return res.data;
}

export async function deleteJpCompetencyCluster(id: number): Promise<void> {
  await api.delete(`/job-profiles/competency-clusters/${id}`);
}

/* ── Items ── */
export async function getJpCompetencyItems(): Promise<JpCompetency[]> {
  const res = await api.get("/job-profiles/competency-items");
  return res.data;
}

export async function createJpCompetencyItem(
  data: Partial<JpCompetency>,
): Promise<JpCompetency> {
  const res = await api.post("/job-profiles/competency-items", data);
  return res.data;
}

export async function updateJpCompetencyItem(
  id: number,
  data: Partial<JpCompetency>,
): Promise<JpCompetency> {
  const res = await api.patch(`/job-profiles/competency-items/${id}`, data);
  return res.data;
}

export async function deleteJpCompetencyItem(id: number): Promise<void> {
  await api.delete(`/job-profiles/competency-items/${id}`);
}
