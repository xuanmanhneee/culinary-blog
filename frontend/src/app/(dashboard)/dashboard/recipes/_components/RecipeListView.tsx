"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BookOpen, ImageOff, Plus } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/common/EmptyState";
import Pagination from "@/components/common/Pagination";
import { RecipeCard } from "@/components/recipes/RecipeCard";
import { RecipeDifficultyBadge } from "@/components/recipes/RecipeDifficultyBadge";
import { RecipeStatusBadge } from "@/components/recipes/RecipeStatusBadge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate, formatTotalTime } from "@/lib/recipe-format";
import { RECIPE_STATUS_LABELS, RecipeStatus, type RecipeListItemDto } from "@/lib/types/recipe";
import { RecipeRowActions, type RecipeAction } from "./RecipeRowActions";

const PAGE_SIZE = 5;

type StatusFilter = "all" | `${RecipeStatus}`;

const filters: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: `${RecipeStatus.Draft}`, label: RECIPE_STATUS_LABELS[RecipeStatus.Draft] },
  { value: `${RecipeStatus.Published}`, label: RECIPE_STATUS_LABELS[RecipeStatus.Published] },
  { value: `${RecipeStatus.Archived}`, label: RECIPE_STATUS_LABELS[RecipeStatus.Archived] },
];

const actionResults: Record<Exclude<RecipeAction, "delete">, { status: RecipeStatus; message: string }> = {
  publish: { status: RecipeStatus.Published, message: "Đã xuất bản" },
  unpublish: { status: RecipeStatus.Draft, message: "Đã chuyển về bản nháp" },
  archive: { status: RecipeStatus.Archived, message: "Đã lưu trữ" },
};

/**
 * Danh sách công thức của tác giả (FR-RCP-001) kèm thao tác FR-RCP-005/006/007.
 * Giao diện tĩnh: thao tác chỉ đổi dữ liệu mẫu trong state, chưa gọi API.
 */
export function RecipeListView({ initialRecipes }: { initialRecipes: RecipeListItemDto[] }) {
  const [recipes, setRecipes] = useState(initialRecipes);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);

  const counts = useMemo(() => {
    const byStatus: Record<StatusFilter, number> = { all: recipes.length, "0": 0, "1": 0, "2": 0 };
    for (const recipe of recipes) byStatus[`${recipe.status}`] += 1;
    return byStatus;
  }, [recipes]);

  const filtered = filter === "all" ? recipes : recipes.filter((recipe) => `${recipe.status}` === filter);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function handleAction(recipe: RecipeListItemDto, action: RecipeAction) {
    if (action === "delete") {
      setRecipes((current) => current.filter((item) => item.id !== recipe.id));
      toast.success(`Đã xóa "${recipe.title}"`);
      return;
    }

    const result = actionResults[action];
    setRecipes((current) =>
      current.map((item) =>
        item.id === recipe.id
          ? {
              ...item,
              status: result.status,
              publishedAt: result.status === RecipeStatus.Published ? new Date().toISOString() : item.publishedAt,
            }
          : item,
      ),
    );
    toast.success(`${result.message}: "${recipe.title}"`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold">Công thức của tôi</h1>
          <p className="text-sm text-muted-foreground">
            Quản lý bản nháp, công thức đã xuất bản và đã lưu trữ.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/recipes/new">
            <Plus />
            Tạo công thức
          </Link>
        </Button>
      </div>

      <Tabs
        value={filter}
        onValueChange={(value) => {
          setFilter(value as StatusFilter);
          setPage(1);
        }}
      >
        <TabsList className="flex-wrap">
          {filters.map((item) => (
            <TabsTrigger key={item.value} value={item.value}>
              {item.label}
              <span className="rounded-full bg-muted px-1.5 text-xs text-muted-foreground">{counts[item.value]}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {pageItems.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={filter === "all" ? "Bạn chưa có công thức nào" : "Không có công thức ở trạng thái này"}
          description={
            filter === "all"
              ? "Bắt đầu chia sẻ món ngon đầu tiên của bạn với mọi người."
              : "Chọn tab khác hoặc tạo công thức mới."
          }
          action={
            <Button asChild variant="outline">
              <Link href="/dashboard/recipes/new">
                <Plus />
                Tạo công thức
              </Link>
            </Button>
          }
        />
      ) : (
        <>
          {/* Máy tính: bảng đủ cột. */}
          <div className="hidden overflow-hidden rounded-xl border bg-background md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Công thức</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Độ khó</TableHead>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className="w-12">
                    <span className="sr-only">Thao tác</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageItems.map((recipe) => (
                  <TableRow key={recipe.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted text-muted-foreground">
                          {recipe.primaryImageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={recipe.primaryImageUrl} alt="" className="size-full object-cover" loading="lazy" />
                          ) : (
                            <ImageOff className="size-4" aria-hidden />
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/dashboard/recipes/${recipe.id}/edit`}
                            className="block truncate font-medium hover:underline"
                          >
                            {recipe.title}
                          </Link>
                          <span className="text-xs text-muted-foreground">{recipe.category?.name ?? "—"}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <RecipeStatusBadge status={recipe.status} />
                    </TableCell>
                    <TableCell>
                      <RecipeDifficultyBadge difficulty={recipe.difficulty} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatTotalTime(recipe.prepTimeMinutes, recipe.cookTimeMinutes)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(recipe.createdAt)}</TableCell>
                    <TableCell>
                      <RecipeRowActions recipe={recipe} onAction={handleAction} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Điện thoại: dạng card, menu thao tác ở góc. */}
          <div className="grid gap-4 sm:grid-cols-2 md:hidden">
            {pageItems.map((recipe) => (
              <div key={recipe.id} className="relative">
                <RecipeCard recipe={recipe} href={`/dashboard/recipes/${recipe.id}/edit`} showStatus />
                <div className="absolute top-2 right-2 rounded-md bg-background/90">
                  <RecipeRowActions recipe={recipe} onAction={handleAction} />
                </div>
              </div>
            ))}
          </div>

          <Pagination
            page={currentPage}
            totalPages={totalPages}
            hasPreviousPage={currentPage > 1}
            hasNextPage={currentPage < totalPages}
            onPageChange={setPage}
            ariaLabel="Phân trang công thức"
          />
        </>
      )}
    </div>
  );
}
