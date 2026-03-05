import api from "../api";
import type { UserProfile, UpdateProfilePayload } from "./interfaces";

export async function getMyProfile(): Promise<UserProfile> {
  const res = await api.get("/users/me");
  return res.data;
}

export async function updateMyProfile(
  data: UpdateProfilePayload,
): Promise<UserProfile> {
  const res = await api.patch("/users/me", data);
  return res.data;
}
