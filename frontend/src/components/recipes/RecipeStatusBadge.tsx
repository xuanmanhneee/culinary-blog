import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { RECIPE_STATUS_LABELS, RecipeStatus } from "@/lib/types/recipe";

const statusClassNames: Record<RecipeStatus, string> = {
  [RecipeStatus.Draft]: "border-accent-soft bg-accent-soft text-accent-hover",
  [RecipeStatus.Published]: "border-primary-soft bg-primary-soft text-primary",
  [RecipeStatus.Archived]: "border-border bg-muted text-muted-foreground",
};

/** Bản nháp / Đã xuất bản / Đã lưu trữ (FR-RCP-005, FR-RCP-006). */
export function RecipeStatusBadge({ status, className }: { status: RecipeStatus; className?: string }) {
  return (
    <Badge variant="outline" className={cn(statusClassNames[status], className)}>
      {RECIPE_STATUS_LABELS[status]}
    </Badge>
  );
}
