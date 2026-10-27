/**
 * Kiểu dữ liệu module Auth (FR-AUTH), khớp DTO backend
 * CulinaryBlog.Application.Auth.Models.AuthModels.
 */
import type { IsoDateTime } from "./api";

/** Vai trò từ backend (CulinaryBlog.Domain.Modules.Identity.Roles). Guest = không có role nào. */
export const Roles = {
  Admin: "Admin",
  Author: "Author",
} as const;
export type Role = (typeof Roles)[keyof typeof Roles];

/** Thông tin user trả kèm token (FR-AUTH-001). `id` là id Identity dạng chuỗi, không phải Guid. */
export interface AuthUserDto {
  id: string;
  fullName: string;
  email: string;
  userName: string;
  avatarUrl: string | null;
  bio: string | null;
  roles: Role[];
}

/** POST /api/v1/auth/register, /login, /refresh (FR-AUTH-001/002/004). */
export interface AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  /** Hết hạn access token (TTL 15 phút) — dùng để chủ động refresh trước khi hết hạn. */
  expiresAt: IsoDateTime;
  user: AuthUserDto;
}

/** GET/PATCH /api/v1/auth/me (FR-AUTH-006/007). Không chứa dữ liệu nhạy cảm. */
export interface UserProfileDto {
  id: string;
  fullName: string;
  email: string;
  userName: string;
  avatarUrl: string | null;
  bio: string | null;
  roles: Role[];
  emailConfirmed: boolean;
  createdAt: IsoDateTime;
}

/** POST /api/v1/auth/register. Password ≥ 8 ký tự, có hoa + thường + số + ký tự đặc biệt. */
export interface RegisterRequest {
  fullName: string;
  email: string;
  userName: string;
  password: string;
}

/** POST /api/v1/auth/login. Sai 5 lần → khóa 15 phút (423). */
export interface LoginRequest {
  email: string;
  password: string;
}

/** POST /api/v1/auth/refresh — backend quay vòng token, token cũ bị revoke. */
export interface RefreshRequest {
  refreshToken: string;
}

/** POST /api/v1/auth/logout. */
export interface LogoutRequest {
  refreshToken: string;
}

/** PATCH /api/v1/auth/me — field nào null thì giữ nguyên; avatarUrl = "" nghĩa là xóa. */
export interface UpdateProfileRequest {
  fullName?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
}

/** POST /api/v1/auth/change-password. */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
