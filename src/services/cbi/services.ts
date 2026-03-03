import api from "../api";
import type { CbiTemplate } from "./interfaces";

export async function getTemplates(): Promise<CbiTemplate[]> {
  const res = await api.get("/cbi/templates");
  return res.data;
}

export async function createTemplate(
  data: Partial<CbiTemplate>,
): Promise<CbiTemplate> {
  const res = await api.post("/cbi/templates", data);
  return res.data;
}

export async function updateTemplate(
  id: number,
  data: Partial<CbiTemplate>,
): Promise<CbiTemplate> {
  const res = await api.patch(`/cbi/templates/${id}`, data);
  return res.data;
}

export async function deleteTemplate(id: number): Promise<void> {
  await api.delete(`/cbi/templates/${id}`);
}
