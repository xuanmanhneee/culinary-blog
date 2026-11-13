"use client";

import { HeartOff } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { unsaveRecipe } from "@/lib/api/engagement";
import { Button } from "@/components/ui/button";

export function SavedRecipeActions({ recipeId }: { recipeId: string }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (!session?.accessToken || busy) return;
    setBusy(true);
    try {
      await unsaveRecipe(recipeId, session.accessToken);
      router.refresh();
    } catch {
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return <Button type="button" variant="ghost" size="icon" disabled={busy} onClick={() => void remove()} aria-label="Bỏ lưu công thức"><HeartOff /></Button>;
}
