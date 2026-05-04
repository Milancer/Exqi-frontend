import api from "../api";
import type { BusinessProcessNode } from "../job-profiles/interfaces";

/* List the three Group nodes (Enterprise / Core / Support). */
export async function getBusinessProcessGroups(): Promise<BusinessProcessNode[]> {
  const res = await api.get("/business-processes/groups");
  return res.data;
}

/**
 * Return the catalogue tree, optionally filtered to one Group by code
 * (e.g. "Enterprise"). Children are nested.
 */
export async function getBusinessProcessTree(
  group?: string,
): Promise<BusinessProcessNode[]> {
  const res = await api.get("/business-processes/tree", {
    params: group ? { group } : {},
  });
  return res.data;
}

/** Admin-only: re-seed the catalogue from a workbook on disk. */
export async function importBusinessProcessCatalogue(
  filePath: string,
): Promise<{
  groupsUpserted: number;
  processesUpserted: number;
  subProcessesUpserted: number;
  proceduresUpserted: number;
  totalNodesAfter: number;
}> {
  const res = await api.post("/business-processes/import", { filePath });
  return res.data;
}
