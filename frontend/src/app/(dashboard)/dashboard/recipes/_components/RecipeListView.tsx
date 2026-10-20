"use client";

import Link from "next/link";
import { useState } from "react";
import { BookOpen, ImageOff, Plus } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import Pagination from "@/components/common/Pagination";
import { RecipeCard } from "@/components/recipes/RecipeCard";
import { RecipeDifficultyBadge } from "@/components/recipes/RecipeDifficultyBadge";
import { RecipeStatusBadge } from "@/components/recipes/RecipeStatusBadge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getErrorMessage } from "@/lib/api/problem";
import { useChangeRecipeStatus, useDeleteRecipe, useMyRecipeCounts, useMyRecipes } from "@/lib/hooks/useRecipeManagement";
import { formatDate, formatTotalTime } from "@/lib/recipe-format";
import { RECIPE_STATUS_LABELS, RecipeStatus, type RecipeListItemDto } from "@/lib/types/recipe";
import { RecipeRowActions, type RecipeAction } from "./RecipeRowActions";

const PAGE_SIZE = 10;

type StatusFilter = "all" | RecipeStatus;

const filters: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: RecipeStatus.Draft, label: RECIPE_STATUS_LABELS[RecipeStatus.Draft] },
  { value: RecipeStatus.Published, label: RECIPE_STATUS_LABELS[RecipeStatus.Published] },
  { value: RecipeStatus.Archived, label: RECIPE_STATUS_LABELS[RecipeStatus.Archived] },
];

const actionMessages: Record<RecipeAction, string> = {
  publish: "Đã xuất bản",
  unpublish: "Đã chuyển về bản nháp",
  archive: "Đã lưu trữ",
  delete: "Đã xóa",
};

/** Danh sách công thức của tác giả đang đăng nhập (GET /recipes?mine=true) kèm thao tác FR-RCP-005/006/007. */
export function RecipeListView() {
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);

  const status = filter === "all" ? undefined : filter;
  const recipes = useMyRecipes({ page, pageSize: PAGE_SIZE, status, sort: "-createdAt" });
  const counts = useMyRecipeCounts();
  const changeStatus = useChangeRecipeStatus();
  const deleteRecipe = useDeleteRecipe();

  const data = recipes.data;
  const items = data?.items ?? [];

  async function handleAction(recipe: RecipeListItemDto, action: RecipeAction) {
    try {
      if (action === "delete") {
        await deleteRecipe.mutateAsync(recipe.id);
        // Xóa phần tử cuối của trang cuối → lùi về trang trước.
        if (items.length === 1 && page > 1) setPage(page - 1);
      } else {
        await changeStatus.mutateAsync({ id: recipe.id, action });
      }
      toast.success(`${actionMessages[action]}: "${recipe.title}"`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold">Công thức của tôi</h1>
          <p className="text-sm text-muted-foreground">Quản lý bản nháp, công thức đã xuất bản và đã lưu trữ.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/recipes/new">
            <Plus />
            Tạo công thức
          </Link>
        </Button>
      </div>

      <Tabs
        value={String(filter)}
        onValueChange={(value) => {
          setFilter(value === "all" ? "all" : (Number(value) as RecipeStatus));
          setPage(1);
        }}
      >
        <TabsList className="flex-wrap">
          {filters.map((item) => (
            <TabsTrigger key={item.value} value={String(item.value)}>
              {item.label}
              <span className="rounded-full bg-muted px-1.5 text-xs text-muted-foreground">
                {counts[item.value] ?? "…"}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {recipes.isPending ? (
        <ListSkeleton />
      ) : recipes.isError ? (
        <ErrorState
          title="Không tải được danh sách công thức"
          message={getErrorMessage(recipes.error)}
          onRetry={() => void recipes.refetch()}
        />
      ) : items.length === 0 ? (
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
        <div className={recipes.isPlaceholderData ? "opacity-60 transition-opacity" : undefined}>
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
                {items.map((recipe) => (
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
            {items.map((recipe) => (
              <div key={recipe.id} className="relative">
                <RecipeCard recipe={recipe} href={`/dashboard/recipes/${recipe.id}/edit`} showStatus />
                <div className="absolute top-2 right-2 rounded-md bg-background/90">
                  <RecipeRowActions recipe={recipe} onAction={handleAction} />
                </div>
              </div>
            ))}
          </div>

          {data && (
            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              hasPreviousPage={data.hasPreviousPage}
              hasNextPage={data.hasNextPage}
              onPageChange={setPage}
              isDisabled={recipes.isFetching}
              ariaLabel="Phân trang công thức"
            />
          )}
        </div>
      )}
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-3 rounded-xl border bg-background p-4" aria-busy="true" aria-label="Đang tải danh sách">
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="flex items-center gap-3">
          <Skeleton className="size-12 rounded-md" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-6 w-24" />
        </div>
      ))}
    </div>
  );
}
