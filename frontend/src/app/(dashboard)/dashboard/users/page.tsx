import { Search } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
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
  const [result, admins] = await Promise.all([
    listUsers({ page, pageSize: PAGE_SIZE, role, search }, session.accessToken),
    listUsers({ pageSize: 1, role: Roles.Admin }, session.accessToken),
  ]);

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
      <PageHeader eyebrow="Quản trị" title="Người dùng" description="Quản lý tài khoản, vai trò và quyền truy cập." />

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <nav className="flex flex-wrap gap-2" aria-label="Lọc người dùng theo vai trò">
          <RoleLink href={hrefFor({ search })} active={!role}>Tất cả</RoleLink>
          <RoleLink href={hrefFor({ role: Roles.Admin, search })} active={role === Roles.Admin}>Admin</RoleLink>
          <RoleLink href={hrefFor({ role: Roles.Author, search })} active={role === Roles.Author}>Tác giả</RoleLink>
        </nav>
        <form className="flex w-full gap-2 sm:max-w-md" action="/dashboard/users">
          {role && <input type="hidden" name="role" value={role} />}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
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
        currentUserId={session.user.id}
        adminCount={admins.totalCount}
      />
    </section>
  );
}

function RoleLink({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return <Link href={href} aria-current={active ? "page" : undefined} className={`rounded-full px-4 py-2 text-sm font-bold ${active ? "bg-primary text-white" : "bg-muted text-foreground hover:bg-muted"}`}>{children}</Link>;
}

function parseRole(value?: string): Role | undefined {
  return value === Roles.Admin || value === Roles.Author ? value : undefined;
}
