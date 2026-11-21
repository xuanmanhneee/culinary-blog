"use client";

import { PencilLine } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { canUseDashboard } from "@/lib/types/auth";

/**
 * Nút "Sửa công thức" chỉ dành cho chủ công thức.
 * Đọc phiên ở client để trang công khai vẫn được cache ISR (không gọi auth() khi render server).
 */
export function RecipeOwnerActions({ recipeId, authorId }: { recipeId: string; authorId: string | undefined }) {
  const { data: session } = useSession();
  const user = session?.user;
  if (!user || !canUseDashboard(user.roles)) return null;

  const isOwner = !!authorId && user.id === authorId;
  if (!isOwner) return null;

  return (
    <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
      <Badge variant="outline">Công thức của bạn</Badge>
      <Button asChild size="sm" variant="outline">
        <Link href={`/dashboard/recipes/${recipeId}/edit`}><PencilLine aria-hidden /> Sửa công thức</Link>
      </Button>
    </div>
  );
}
