import { Search, ShieldCheck, UsersRound } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { auth } from "@/auth";
import { Pagination } from "@/components/common/Pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listUsers } from "@/lib/api/users";
import { Roles, type Role } from "@/lib/types/auth";

export const metadata: Metadata = { title: "Quản lý người dùng" };

const PAGE_SIZE = 20;

interface UsersPageProps {
  searchParams: Promise<{ page?: string; role?: string; search?: string }>;
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const session = await auth();
  if (!session?.accessToken || !session.user.roles?.includes(Roles.Admin)) redirect("/dashboard/recipes");

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const role = parseRole(params.role);
  const search = params.search?.trim().slice(0, 100) || undefined;
  const result = await listUsers({ page, pageSize: PAGE_SIZE, role, search }, session.accessToken);

  const hrefFor = (next: { page?: number; role?: Role; search?: string }) => {
    const query = new URLSearchParams();
    if (next.page && next.page > 1) query.set("page", String(next.page));
    if (next.role) query.set("role", next.role);
    if (next.search) query.set("search", next.search);
    const suffix = query.toString();
    return suffix ? `/dashboard/users?${suffix}` : "/dashboard/users";
  };

  return (
    <section className="space-y-7">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.15em] text-[#a84f37]">Quản trị hệ thống</p>
          <h1 className="font-display mt-2 text-4xl font-bold tracking-[-.04em] text-[#29231f]">Người dùng</h1>
          <p className="mt-2 text-sm text-[#786e66]">Xem tài khoản quản trị viên và tác giả đang sử dụng hệ thống.</p>
        </div>
        <div className="rounded-2xl border border-[#d8cbbc] bg-[#f1e7da] px-5 py-3">
          <span className="text-xs font-semibold text-[#776d65]">Tổng tài khoản</span>
          <strong className="ml-3 font-display text-2xl text-[#1f4b3f]">{result.totalCount}</strong>
        </div>
      </header>

      <div className="flex flex-col gap-3 rounded-2xl border border-[#ddd1c3] bg-[#fffdf9] p-4 sm:flex-row sm:items-center sm:justify-between">
        <nav className="flex flex-wrap gap-2" aria-label="Lọc người dùng theo vai trò">
          <RoleLink href={hrefFor({ search })} active={!role}>Tất cả</RoleLink>
          <RoleLink href={hrefFor({ role: Roles.Admin, search })} active={role === Roles.Admin}>Admin</RoleLink>
          <RoleLink href={hrefFor({ role: Roles.Author, search })} active={role === Roles.Author}>Tác giả</RoleLink>
        </nav>
        <form className="flex w-full gap-2 sm:max-w-md" action="/dashboard/users">
          {role && <input type="hidden" name="role" value={role} />}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#8b8178]" />
            <Input name="search" defaultValue={search} maxLength={100} placeholder="Tên, email hoặc tên đăng nhập" className="pl-9" />
          </div>
          <Button type="submit" variant="outline">Tìm</Button>
        </form>
      </div>

      <div className="overflow-hidden rounded-[1.5rem] border border-[#ddd1c3] bg-[#fffdf9] shadow-[0_16px_45px_rgba(75,57,41,.06)]">
        {result.items.length === 0 ? (
          <div className="grid min-h-64 place-items-center px-6 text-center">
            <div>
              <UsersRound className="mx-auto size-10 text-[#9d9187]" />
              <h2 className="font-display mt-3 text-xl font-bold">Không tìm thấy người dùng</h2>
              <p className="mt-1 text-sm text-[#786e66]">Thử thay đổi vai trò hoặc từ khóa tìm kiếm.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-[#e1d7cb] bg-[#f6efe6] text-xs uppercase tracking-wide text-[#746b63]">
                <tr><th className="px-5 py-3">Người dùng</th><th className="px-5 py-3">Vai trò</th><th className="px-5 py-3">Xác thực</th><th className="px-5 py-3">Trạng thái</th><th className="px-5 py-3">Ngày tham gia</th></tr>
              </thead>
              <tbody className="divide-y divide-[#ebe3d9]">
                {result.items.map((user) => (
                  <tr key={user.id} className="hover:bg-[#fbf7f1]">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-[#1f4b3f] font-bold text-white">
                          {user.avatarUrl ? <Image src={user.avatarUrl} alt="" fill sizes="40px" unoptimized className="object-cover" /> : initials(user.fullName, user.email)}
                        </span>
                        <span><strong className="block text-[#342e29]">{user.fullName}</strong><span className="block text-xs text-[#81776f]">{user.email} · @{user.userName}</span></span>
                      </div>
                    </td>
                    <td className="px-5 py-4"><div className="flex flex-wrap gap-1">{user.roles.map((item) => <Badge key={item} variant={item === Roles.Admin ? "default" : "outline"}>{item === Roles.Admin ? <ShieldCheck /> : null}{item}</Badge>)}</div></td>
                    <td className="px-5 py-4">{user.emailConfirmed ? <span className="text-emerald-700">Đã xác nhận</span> : <span className="text-amber-700">Chưa xác nhận</span>}</td>
                    <td className="px-5 py-4"><Badge variant={user.isActive ? "outline" : "warm"}>{user.isActive ? "Hoạt động" : "Đã khóa"}</Badge></td>
                    <td className="px-5 py-4 text-[#6f665e]">{formatDate(user.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination currentPage={result.page} totalPages={result.totalPages} hrefForPage={(nextPage) => hrefFor({ page: nextPage, role, search })} />
    </section>
  );
}

function RoleLink({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return <Link href={href} aria-current={active ? "page" : undefined} className={`rounded-full px-4 py-2 text-sm font-bold ${active ? "bg-[#1f4b3f] text-white" : "bg-[#f1e8dc] text-[#625950] hover:bg-[#e7dccf]"}`}>{children}</Link>;
}

function parseRole(value?: string): Role | undefined {
  return value === Roles.Admin || value === Roles.Author ? value : undefined;
}

function initials(name: string, email: string): string {
  return (name.trim() || email.split("@")[0] || "U").split(/\s+/).slice(-2).map((part) => part[0]).join("").toUpperCase();
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeZone: "Asia/Bangkok" }).format(new Date(value));
}
