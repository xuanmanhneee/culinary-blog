"use server";

import { updateTag } from "next/cache";
import { auth } from "@/auth";

/**
 * Làm mới cache ISR các trang công khai có công thức (chi tiết, danh sách, trang chủ – đều gắn tag
 * "recipes" ở lib/api/recipes.ts, recipe-detail.ts) ngay sau khi tác giả tạo/sửa/đổi trạng thái/xóa,
 * thay vì chờ hết 300 giây. Chỉ người đã đăng nhập mới gọi được.
 */
export async function refreshPublicRecipes(): Promise<void> {
  const session = await auth();
  if (!session?.user) return;
  updateTag("recipes");
}
