import { apiFetch } from "@/lib/api/client";
import type { AuthResponseDto, RegisterRequest, UpdateProfileRequest, UserProfileDto } from "@/lib/types/auth";

export function registerAccount(request: RegisterRequest): Promise<AuthResponseDto> {
  return apiFetch<AuthResponseDto>("/auth/register", { method: "POST", body: request });
}

export function getMyProfile(token: string, signal?: AbortSignal): Promise<UserProfileDto> {
  return apiFetch<UserProfileDto>("/auth/me", { token, signal, cache: "no-store" });
}

export function updateMyProfile(token: string, request: UpdateProfileRequest): Promise<UserProfileDto> {
  return apiFetch<UserProfileDto>("/auth/me", { method: "PATCH", token, body: request });
}
