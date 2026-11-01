import { apiFetch } from "@/lib/api/client";
import type {
  AuthResponseDto,
  ChangePasswordRequest,
  RegisterRequest,
  UpdateProfileRequest,
  UserProfileDto,
} from "@/lib/types/auth";

export function registerAccount(request: RegisterRequest): Promise<AuthResponseDto> {
  return apiFetch<AuthResponseDto>("/auth/register", { method: "POST", body: request });
}

export function getMyProfile(token: string, signal?: AbortSignal): Promise<UserProfileDto> {
  return apiFetch<UserProfileDto>("/auth/me", { token, signal, cache: "no-store" });
}

export function updateMyProfile(token: string, request: UpdateProfileRequest): Promise<UserProfileDto> {
  return apiFetch<UserProfileDto>("/auth/me", { method: "PATCH", token, body: request });
}

export function changeMyPassword(token: string, request: ChangePasswordRequest): Promise<void> {
  return apiFetch<void>("/auth/change-password", { method: "POST", token, body: request });
}
