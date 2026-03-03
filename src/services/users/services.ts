import api from "../api";
import type { User } from "./interfaces";

export async function getUsers(): Promise<User[]> {
  const res = await api.get("/users");
  return res.data;
}

export async function createUser(
  data: Partial<User> & { password?: string },
): Promise<User> {
  const res = await api.post("/users", data);
  return res.data;
}

export async function updateUser(
  id: number,
  data: Partial<User> & { password?: string },
): Promise<User> {
  const res = await api.patch(`/users/${id}`, data);
  return res.data;
}

export async function deleteUser(id: number): Promise<void> {
  await api.delete(`/users/${id}`);
}
