import api from "../api";
import type { Client } from "./interfaces";

export async function getClients(): Promise<Client[]> {
  const res = await api.get("/clients");
  return res.data;
}

export async function createClient(data: Partial<Client>): Promise<Client> {
  const res = await api.post("/clients", data);
  return res.data;
}

export async function updateClient(
  id: number,
  data: Partial<Client>,
): Promise<Client> {
  const res = await api.patch(`/clients/${id}`, data);
  return res.data;
}

export async function deleteClient(id: number): Promise<void> {
  await api.delete(`/clients/${id}`);
}
