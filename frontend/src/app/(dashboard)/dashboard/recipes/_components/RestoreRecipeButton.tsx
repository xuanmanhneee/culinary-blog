"use client";

import { Loader2, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getRecipeErrorMessage } from "@/lib/api/problem";
import { useRestoreRecipe } from "@/lib/hooks/useRecipeManagement";

export function RestoreRecipeButton({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const restore = useRestoreRecipe();

  async function handleRestore() {
    try {
      await restore.mutateAsync(id);
      toast.success(`Đã khôi phục “${title}”.`);
      router.refresh();
    } catch (error) {
      toast.error(getRecipeErrorMessage(error));
    }
  }

  return (
    <Button variant="outline" size="sm" disabled={restore.isPending} onClick={() => void handleRestore()}>
      {restore.isPending ? <Loader2 className="animate-spin" /> : <RotateCcw />}
      Khôi phục
    </Button>
  );
}
