import type { Metadata } from "next";
import { PageHeader } from "@/components/common/PageHeader";
import Link from "next/link";
import { ArrowRight, BookOpenText, FolderTree, Plus, UsersRound } from "lucide-react";
import { auth } from "@/auth";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getRecipeById, listMyRecipes } from "@/lib/api/recipe-management";
import { apiFetch } from "@/lib/api/client";
import { getCategories } from "@/lib/api/categories";
import { listUsers } from "@/lib/api/users";
import { getErrorMessage } from "@/lib/errors";
import type { PagedResult } from "@/lib/types/api";
import { Roles, type AdminUserListItem } from "@/lib/types/auth";
import { RecipeStatus, type RecipeListItemDto } from "@/lib/types/recipe";

export const metadata: Metadata = { title: "Tổng quan" };

const draftListUrl = `/dashboard/recipes?status=${RecipeStatus.Draft}`;

async function loadDrafts(token: string) {
  const { items } = await listMyRecipes({ pageSize: 5, status: RecipeStatus.Draft, sort: "-updatedAt" }, token);
  // shortcut: tối đa 5 lượt đọc chi tiết, chuyển sang dữ liệu tóm tắt nếu danh sách cần mở rộng.
  const details = await Promise.allSettled(items.map(({ id }) => getRecipeById(id, token)));
  return items.map((draft, index) => {
    const detail = details[index];
    return {
      ...draft,
      stepCount: detail.status === "fulfilled" ? detail.value.recipe.steps.length : null,
    };
  });
}

async function loadAllUsers(token: string): Promise<AdminUserListItem[]> {
  const first = await listUsers({ pageSize: 50 }, token);
  if (first.totalPages <= 1) return first.items;
  // shortcut: dashboard tổng hợp từ API phân trang hiện có; thêm endpoint thống kê khi số trang gây chậm.
  const rest = await Promise.all(Array.from({ length: first.totalPages - 1 }, (_, index) =>
    listUsers({ page: index + 2, pageSize: 50 }, token),
  ));
  return [first, ...rest].flatMap((page) => page.items);
}

async function loadAdminStats(token: string) {
  const recipeCount = (status?: RecipeStatus) => apiFetch<PagedResult<RecipeListItemDto>>(
    `/recipes?pageSize=1${status === undefined ? "" : `&status=${status}`}`,
    { token, cache: "no-store" },
  );
  const [users, allRecipes, drafts, published, archived, categories] = await Promise.all([
    loadAllUsers(token),
    recipeCount(),
    recipeCount(RecipeStatus.Draft),
    recipeCount(RecipeStatus.Published),
    recipeCount(RecipeStatus.Archived),
    getCategories(),
  ]);
  return {
    users: {
      total: users.length,
      active: users.filter((user) => user.isActive && !user.isLocked).length,
      locked: users.filter((user) => user.isLocked).length,
    },
    recipes: {
      total: allRecipes.totalCount,
      drafts: drafts.totalCount,
      published: published.totalCount,
      archived: archived.totalCount,
    },
    categoryCount: categories.length,
  };
}

export default async function DashboardPage() {
  const session = await auth();
  const token = session?.accessToken;
  const isAdmin = session?.user.roles?.includes(Roles.Admin) ?? false;

  if (isAdmin) {
    const data = token
      ? await loadAdminStats(token).then((stats) => ({ stats })).catch((error: unknown) => ({ error: getErrorMessage(error) }))
      : { error: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại." };
    return <AdminDashboard data={data} />;
  }

  const data = token
    ? await loadDrafts(token).then((drafts) => ({ drafts })).catch((error: unknown) => ({ error: getErrorMessage(error) }))
    : { error: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại." };

  return (
    <section className="space-y-7">
      <PageHeader eyebrow="Tổng quan" title="Bếp đang làm" description="Tiếp tục các bản nháp của bạn." actions={<Button asChild><Link href="/dashboard/recipes/new"><Plus />Tạo công thức</Link></Button>} />

      {"error" in data ? (
        <ErrorState title="Không tải được bản nháp" message={data.error} />
      ) : (
        <section aria-labelledby="draft-heading" className="rounded-2xl border border-border bg-card">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
            <h2 id="draft-heading" className="text-lg font-bold text-foreground">Tiếp tục bản nháp</h2>
            {data.drafts.length > 0 && (
              <Button asChild variant="ghost" size="sm"><Link href={draftListUrl}>Xem tất cả bản nháp <ArrowRight /></Link></Button>
            )}
          </header>
          {data.drafts.length > 0 ? (
            <ul className="divide-y">
              {data.drafts.map(({ id, title, category, stepCount }) => (
                <li key={id} className="grid gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
                  <div className="min-w-0">
                    <h3 className="break-words font-semibold text-foreground">{title}</h3>
                    {category && <p className="mt-1 text-sm text-muted-foreground">{category.name}</p>}
                  </div>
                  <Badge variant={stepCount === 0 ? "warm" : "outline"} className="max-w-full whitespace-normal">
                    {stepCount === null ? "Chưa kiểm tra được các bước" : stepCount === 0 ? "Thiếu bước thực hiện" : `${stepCount} bước thực hiện`}
                  </Badge>
                  <Button asChild variant="outline" size="sm" className="justify-self-start">
                    <Link href={`/dashboard/recipes/${id}/edit`} aria-label={`Tiếp tục sửa ${title}`}>Tiếp tục sửa <ArrowRight /></Link>
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Bạn chưa có bản nháp nào" description="Công thức lưu dưới dạng bản nháp sẽ xuất hiện ở đây." className="m-5" />
          )}
        </section>
      )}
    </section>
  );
}

function AdminDashboard({ data }: { data: { stats: Awaited<ReturnType<typeof loadAdminStats>> } | { error: string } }) {
  return (
    <section className="space-y-7">
      <PageHeader eyebrow="Quản trị" title="Tổng quan hệ thống" description="Theo dõi dữ liệu và đi nhanh tới các tác vụ vận hành." />
      {"error" in data ? (
        <ErrorState title="Không tải được số liệu quản trị" message={data.error} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <AdminStat title="Tài khoản" value={data.stats.users.total} details={`${data.stats.users.active} hoạt động · ${data.stats.users.locked} bị khóa`} />
            <AdminStat title="Công thức" value={data.stats.recipes.total} details={`${data.stats.recipes.drafts} nháp · ${data.stats.recipes.published} xuất bản · ${data.stats.recipes.archived} lưu trữ`} />
            <AdminStat title="Danh mục" value={data.stats.categoryCount} details="Nhóm phân loại đang sử dụng" />
          </div>
          <section aria-labelledby="quick-links-heading" className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 id="quick-links-heading" className="text-lg font-bold">Truy cập nhanh</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <AdminLink href="/dashboard/recipes" icon={<BookOpenText />} title="Quản lý công thức" description="Kiểm tra và xử lý nội dung của mọi tác giả." />
              <AdminLink href="/dashboard/categories" icon={<FolderTree />} title="Quản lý danh mục" description="Tạo, sửa và sắp xếp danh mục." />
              <AdminLink href="/dashboard/users" icon={<UsersRound />} title="Quản lý người dùng" description="Tìm kiếm, phân quyền và khóa tài khoản." />
            </div>
          </section>
        </>
      )}
    </section>
  );
}

function AdminStat({ title, value, details }: { title: string; value: number; details: string }) {
  return <div className="rounded-2xl border border-border bg-card p-5 shadow-sm"><p className="text-sm font-semibold text-muted-foreground">{title}</p><p className="mt-2 text-3xl font-bold text-primary">{value}</p><p className="mt-2 text-sm text-muted-foreground">{details}</p></div>;
}

function AdminLink({ href, icon, title, description }: { href: string; icon: React.ReactNode; title: string; description: string }) {
  return <Link href={href} className="group rounded-xl border border-border p-4 transition hover:border-primary"><span className="text-primary [&>svg]:size-5">{icon}</span><h3 className="mt-3 font-bold group-hover:text-primary">{title}</h3><p className="mt-1 text-sm text-muted-foreground">{description}</p><span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary">Mở trang <ArrowRight className="size-4" /></span></Link>;
}
