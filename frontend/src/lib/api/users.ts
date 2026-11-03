import { apiFetch } from "@/lib/api/client";
import type { PagedResult } from "@/lib/types/api";
import type { AdminUserListItem, Role } from "@/lib/types/auth";

export interface UserDirectoryQuery {
  page?: number;
  pageSize?: number;
  role?: Role;
  search?: string;
}

export function listUsers(query: UserDirectoryQuery, token: string): Promise<PagedResult<AdminUserListItem>> {
  const params = new URLSearchParams();
  params.set("page", String(query.page ?? 1));
  params.set("pageSize", String(query.pageSize ?? 20));
  if (query.role) params.set("role", query.role);
  if (query.search) params.set("search", query.search);
  return apiFetch(`/users?${params}`, { token, cache: "no-store" });
}

export function updateUserRole(id: string, role: Role, token: string): Promise<void> {
  return apiFetch(`/users/${encodeURIComponent(id)}/role`, {
    method: "PATCH",
    token,
    body: { role },
  });
}

export function updateUserStatus(id: string, isLocked: boolean, token: string): Promise<void> {
  return apiFetch(`/users/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    token,
    body: { isLocked },
  });
}

export function deleteUser(id: string, token: string): Promise<void> {
  return apiFetch(`/users/${encodeURIComponent(id)}`, {
    method: "DELETE",
    token,
  });
}
