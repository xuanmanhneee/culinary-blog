import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { RECIPE_STATUS_LABELS, RecipeStatus } from "@/lib/types/recipe";

const statusClassNames: Record<RecipeStatus, string> = {
  [RecipeStatus.Draft]: "border-amber-200 bg-amber-50 text-amber-800",
  [RecipeStatus.Published]: "border-emerald-200 bg-emerald-50 text-emerald-800",
  [RecipeStatus.Archived]: "border-zinc-200 bg-zinc-100 text-zinc-600",
};

/** Bản nháp / Đã xuất bản / Đã lưu trữ (FR-RCP-005, FR-RCP-006). */
export function RecipeStatusBadge({ status, className }: { status: RecipeStatus; className?: string }) {
  return (
    <Badge variant="outline" className={cn(statusClassNames[status], className)}>
      {RECIPE_STATUS_LABELS[status]}
    </Badge>
  );
}
