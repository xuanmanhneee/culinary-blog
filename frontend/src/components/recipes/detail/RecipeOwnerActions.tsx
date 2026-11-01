"use client";

import { PencilLine } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Roles } from "@/lib/types/auth";

/**
 * Nút "Sửa công thức" cho chủ công thức hoặc Admin.
 * Đọc phiên ở client để trang công khai vẫn được cache ISR (không gọi auth() khi render server).
 */
export function RecipeOwnerActions({ recipeId, authorId }: { recipeId: string; authorId: string | undefined }) {
  const { data: session } = useSession();
  const user = session?.user;
  if (!user) return null;

  const isOwner = !!authorId && user.id === authorId;
  if (!isOwner && !user.roles?.includes(Roles.Admin)) return null;

  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
      <Badge variant="outline">{isOwner ? "Công thức của bạn" : "Quản trị viên"}</Badge>
      <Button asChild size="sm" variant="outline">
        <Link href={`/dashboard/recipes/${recipeId}/edit`}><PencilLine aria-hidden /> Sửa công thức</Link>
      </Button>
    </div>
  );
}
