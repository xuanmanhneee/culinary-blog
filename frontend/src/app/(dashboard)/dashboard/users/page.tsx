import { Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listUsers } from "@/lib/api/users";
import { Roles, type Role } from "@/lib/types/auth";
import { UserManagementTable } from "./UserManagementTable";

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
          <p className="mt-2 text-sm text-[#786e66]">Quản lý tài khoản, vai trò và quyền truy cập của người dùng.</p>
        </div>
      </header>

      <div className="flex flex-col gap-3 rounded-2xl border border-[#ddd1c3] bg-[#fffdf9] p-4 sm:flex-row sm:items-center sm:justify-between">
        <nav className="flex flex-wrap gap-2" aria-label="Lọc người dùng theo vai trò">
          <RoleLink href={hrefFor({ search })} active={!role}>Tất cả</RoleLink>
          <RoleLink href={hrefFor({ role: Roles.Admin, search })} active={role === Roles.Admin}>Admin</RoleLink>
          <RoleLink href={hrefFor({ role: Roles.Author, search })} active={role === Roles.Author}>Tác giả</RoleLink>
          <RoleLink href={hrefFor({ role: Roles.Reader, search })} active={role === Roles.Reader}>Reader</RoleLink>
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

      <UserManagementTable
        key={JSON.stringify(result.items)}
        initialUsers={result.items}
        totalCount={result.totalCount}
        currentPage={result.page}
        totalPages={result.totalPages}
        role={role}
        search={search}
        token={session.accessToken}
      />
    </section>
  );
}

function RoleLink({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return <Link href={href} aria-current={active ? "page" : undefined} className={`rounded-full px-4 py-2 text-sm font-bold ${active ? "bg-[#1f4b3f] text-white" : "bg-[#f1e8dc] text-[#625950] hover:bg-[#e7dccf]"}`}>{children}</Link>;
}

function parseRole(value?: string): Role | undefined {
  return value === Roles.Admin || value === Roles.Author || value === Roles.Reader ? value : undefined;
}
