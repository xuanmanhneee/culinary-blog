import { apiFetch } from "@/lib/api/client";
import type {
  AuthResponseDto,
  RegisterRequest,
  UpdateProfileRequest,
  UserProfileDto,
} from "@/lib/types/auth";

export function registerAccount(request: RegisterRequest): Promise<AuthResponseDto> {
  return apiFetch<AuthResponseDto>("/auth/register", { method: "POST", body: request });
}

export function uploadMyAvatar(token: string, file: File): Promise<UserProfileDto> {
  const body = new FormData();
  body.append("file", file);
  return apiFetch<UserProfileDto>("/auth/me/avatar", { method: "POST", token, body });
}

export function forgotPassword(email: string): Promise<void> {
  return apiFetch<void>("/auth/forgot-password", { method: "POST", body: { email } });
}

export function resetPassword(request: { email: string; token: string; newPassword: string }): Promise<void> {
  return apiFetch<void>("/auth/reset-password", { method: "POST", body: request });
}

export function changePassword(token: string, request: { currentPassword: string; newPassword: string }): Promise<void> {
  return apiFetch<void>("/auth/change-password", { method: "POST", token, body: request });
}

export function confirmEmail(userId: string, token: string): Promise<void> {
  return apiFetch<void>(`/auth/confirm-email?userId=${encodeURIComponent(userId)}&token=${encodeURIComponent(token)}`, { cache: "no-store" });
}

export function getMyProfile(token: string, signal?: AbortSignal): Promise<UserProfileDto> {
  return apiFetch<UserProfileDto>("/auth/me", { token, signal, cache: "no-store" });
}

export function updateMyProfile(token: string, request: UpdateProfileRequest): Promise<UserProfileDto> {
  return apiFetch<UserProfileDto>("/auth/me", { method: "PATCH", token, body: request });
}
