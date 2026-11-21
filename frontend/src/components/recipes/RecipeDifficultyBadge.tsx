import { ChefHat } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { RECIPE_DIFFICULTY_LABELS, RecipeDifficulty } from "@/lib/types/recipe";

const difficultyClassNames: Record<RecipeDifficulty, string> = {
  [RecipeDifficulty.Easy]: "border-sky-200 bg-sky-50 text-sky-800",
  [RecipeDifficulty.Medium]: "border-violet-200 bg-violet-50 text-violet-800",
  [RecipeDifficulty.Hard]: "border-accent-soft bg-accent-soft text-accent-hover",
  [RecipeDifficulty.Expert]: "border-destructive/10 bg-destructive/10 text-destructive",
};

/** Dễ / Trung bình / Khó / Chuyên gia. */
export function RecipeDifficultyBadge({
  difficulty,
  className,
}: {
  difficulty: RecipeDifficulty;
  className?: string;
}) {
  return (
    <Badge variant="outline" className={cn(difficultyClassNames[difficulty], className)}>
      <ChefHat aria-hidden />
      {RECIPE_DIFFICULTY_LABELS[difficulty]}
    </Badge>
  );
}
