"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Pagination } from "@/components/common/Pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/client";
import { deleteUser, updateUserRole, updateUserStatus } from "@/lib/api/users";
import { getErrorMessage } from "@/lib/errors";
import { Roles, type AdminUserListItem, type Role } from "@/lib/types/auth";

interface UserManagementTableProps {
  initialUsers: AdminUserListItem[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  role?: Role;
  search?: string;
  token: string;
  currentUserId: string;
  adminCount: number;
}

export function UserManagementTable({
  initialUsers,
  totalCount: initialTotalCount,
  currentPage,
  totalPages,
  role,
  search,
  token,
  currentUserId,
  adminCount,
}: UserManagementTableProps) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [deletingUser, setDeletingUser] = useState<AdminUserListItem | null>(null);

  async function changeRole(user: AdminUserListItem, nextRole: Role) {
    if (busyUserId || user.roles.length === 1 && user.roles[0] === nextRole || cannotRemoveAdmin(user, nextRole)) return;

    const previousRoles = user.roles;
    setBusyUserId(user.id);
    setUsers((current) => current.map((item) =>
      item.id === user.id ? { ...item, roles: [nextRole] } : item,
    ));

    try {
      await updateUserRole(user.id, nextRole, token);
      toast.success(`Đã đổi vai trò của ${user.fullName} thành ${nextRole}.`);
      router.refresh();
    } catch (error) {
      setUsers((current) => current.map((item) =>
        item.id === user.id ? { ...item, roles: previousRoles } : item,
      ));
      toast.error(problemMessage(error));
    } finally {
      setBusyUserId(null);
    }
  }

  async function toggleLock(user: AdminUserListItem) {
    if (busyUserId || !user.isLocked && cannotDisable(user)) return;

    const nextIsLocked = !user.isLocked;
    setBusyUserId(user.id);
    setUsers((current) => current.map((item) =>
      item.id === user.id ? { ...item, isLocked: nextIsLocked } : item,
    ));

    try {
      await updateUserStatus(user.id, nextIsLocked, token);
      toast.success(nextIsLocked ? `Đã khóa tài khoản ${user.email}.` : `Đã mở khóa tài khoản ${user.email}.`);
      router.refresh();
    } catch (error) {
      setUsers((current) => current.map((item) =>
        item.id === user.id ? { ...item, isLocked: user.isLocked } : item,
      ));
      toast.error(problemMessage(error));
    } finally {
      setBusyUserId(null);
    }
  }

  async function removeUser() {
    if (!deletingUser || busyUserId || cannotDisable(deletingUser)) return;

    const target = deletingUser;
    const previousIndex = users.findIndex((user) => user.id === target.id);
    const wasLastOnPage = users.length === 1;
    setDeletingUser(null);
    setBusyUserId(target.id);
    setUsers((current) => current.filter((user) => user.id !== target.id));
    setTotalCount((count) => Math.max(0, count - 1));

    try {
      await deleteUser(target.id, token);
      toast.success(`Đã xóa tài khoản ${target.email}.`);
      if (wasLastOnPage && currentPage > 1) {
        router.replace(pageHref(currentPage - 1), { scroll: false });
      } else {
        router.refresh();
      }
    } catch (error) {
      setUsers((current) => {
        const restored = [...current];
        restored.splice(Math.max(0, previousIndex), 0, target);
        return restored;
      });
      setTotalCount((count) => count + 1);
      toast.error(problemMessage(error));
    } finally {
      setBusyUserId(null);
    }
  }

  function pageHref(page: number): string {
    const params = new URLSearchParams();
    if (page > 1) params.set("page", String(page));
    if (role) params.set("role", role);
    if (search) params.set("search", search);
    const query = params.toString();
    return query ? `/dashboard/users?${query}` : "/dashboard/users";
  }

  function cannotDisable(user: AdminUserListItem): boolean {
    return user.id === currentUserId || user.roles.includes(Roles.Admin) && adminCount <= 1;
  }

  function cannotRemoveAdmin(user: AdminUserListItem, nextRole: Role): boolean {
    return nextRole !== Roles.Admin && cannotDisable(user);
  }

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          Hiển thị {users.length} trong tổng số {totalCount} tài khoản
        </p>
        <div className="rounded-2xl border border-border bg-card px-5 py-3">
          <span className="text-xs font-semibold text-muted-foreground">Tổng tài khoản</span>
          <strong className="ml-3  text-2xl text-primary">{totalCount}</strong>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {users.length === 0 ? (
          <div className="grid min-h-64 place-items-center px-6 text-center">
            <div>
              <h2 className="text-lg font-bold">Không tìm thấy người dùng</h2>
              <p className="mt-1 text-sm text-muted-foreground">Thử thay đổi vai trò hoặc từ khóa tìm kiếm.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left text-sm">
              <thead className="border-b border-border bg-muted text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th scope="col" className="px-5 py-3">Người dùng</th>
                  <th scope="col" className="px-5 py-3">Vai trò</th>
                  <th scope="col" className="px-5 py-3">Xác thực</th>
                  <th scope="col" className="px-5 py-3">Trạng thái</th>
                  <th scope="col" className="px-5 py-3">Ngày tham gia</th>
                  <th scope="col" className="px-5 py-3"><span className="sr-only">Thao tác</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((user) => {
                  const isBusy = busyUserId === user.id;
                  const selectedRole = user.roles[0] ?? "";
                  const statusLabel = user.isLocked
                    ? "Đã khóa"
                    : user.isActive
                      ? "Hoạt động"
                      : "Ngừng hoạt động";
                  const protectedAdmin = cannotDisable(user);

                  return (
                    <tr key={user.id} className="hover:bg-muted">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-primary font-bold text-white">
                            {user.avatarUrl
                              ? <Image src={user.avatarUrl} alt="" fill sizes="40px" unoptimized className="object-cover" />
                              : initials(user.fullName, user.email)}
                          </span>
                          <span className="min-w-0">
                            <strong className="block truncate text-foreground">{user.fullName}</strong>
                            <span className="block truncate text-xs text-muted-foreground">{user.email} · @{user.userName}</span>
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div>
                          <label className="sr-only" htmlFor={`role-${user.id}`}>Đổi vai trò cho {user.fullName}</label>
                          <select
                            id={`role-${user.id}`}
                            value={selectedRole}
                            disabled={busyUserId !== null || protectedAdmin}
                            onChange={(event) => {
                              const nextRole = parseRole(event.target.value);
                              if (nextRole) void changeRole(user, nextRole);
                            }}
                            className="h-9 max-w-32 rounded-full border border-border bg-card px-3 text-xs font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/35 disabled:opacity-50"
                          >
                            {!selectedRole && <option value="">Chọn vai trò</option>}
                            <option value={Roles.Admin}>Admin</option>
                            <option value={Roles.Author}>Author</option>
                          </select>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {user.emailConfirmed
                          ? <span className="text-primary">Đã xác nhận</span>
                          : <span className="text-accent-hover">Chưa xác nhận</span>}
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={user.isLocked || !user.isActive ? "warm" : "outline"}>{statusLabel}</Badge>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">{formatDate(user.createdAt)}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={busyUserId !== null || !user.isActive && !user.isLocked || !user.isLocked && protectedAdmin}
                            title={!user.isLocked && protectedAdmin ? user.id === currentUserId ? "Bạn không thể tự khóa tài khoản." : "Không thể khóa Admin cuối cùng." : undefined}
                            onClick={() => void toggleLock(user)}
                          >
                            {isBusy ? "Đang lưu…" : user.isLocked ? "Mở khóa" : "Khóa"}
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            disabled={busyUserId !== null || protectedAdmin}
                            title={protectedAdmin ? user.id === currentUserId ? "Bạn không thể tự xóa tài khoản." : "Không thể xóa Admin cuối cùng." : undefined}
                            onClick={() => setDeletingUser(user)}
                          >
                            Xóa
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        hrefForPage={pageHref}
      />

      <ConfirmDialog
        open={deletingUser !== null}
        onOpenChange={(open) => !open && setDeletingUser(null)}
        title="Xóa tài khoản người dùng?"
        description={<>Tài khoản <strong>{deletingUser?.email}</strong> sẽ bị xóa vĩnh viễn. Thao tác này không thể hoàn tác.</>}
        confirmLabel="Xóa tài khoản"
        destructive
        onConfirm={() => void removeUser()}
      />
    </>
  );
}

function initials(name: string, email: string): string {
  return (name.trim() || email.split("@")[0] || "U")
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeZone: "Asia/Bangkok",
  }).format(new Date(value));
}

function problemMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const details = Object.values(error.problem.errors ?? {}).flat();
    if (details.length > 0) return details.join(" ");
  }
  return getErrorMessage(error);
}

function parseRole(value: string): Role | null {
  return value === Roles.Admin || value === Roles.Author
    ? value
    : null;
}
