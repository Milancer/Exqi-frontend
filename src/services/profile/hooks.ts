import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as profileService from "./services";
import type { UpdateProfilePayload } from "./interfaces";

const KEYS = {
  profile: ["my-profile"] as const,
};

export function useMyProfile() {
  return useQuery({
    queryKey: KEYS.profile,
    queryFn: profileService.getMyProfile,
  });
}

export function useUpdateMyProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateProfilePayload) =>
      profileService.updateMyProfile(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.profile }),
  });
}
