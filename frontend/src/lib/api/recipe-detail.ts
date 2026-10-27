/**
 * Lấy chi tiết công thức cho trang /recipes/[slug] (FR-RCP-002), chạy ở server.
 *
 * - Recipe Published: gọi công khai, cache ISR 300 giây (SRS 5.1), gắn tag "recipes" / "recipe:{slug}".
 * - Recipe Draft/Archived: backend trả 403 cho khách; nếu người xem đã đăng nhập thì gọi lại kèm access
 *   token (không cache) – chỉ chủ công thức hoặc Admin mới xem được.
 */
import { cache } from "react";
import { auth } from "@/auth";
import { API_V1 } from "@/lib/config/env";
import type { RecipeDetailDto } from "@/lib/types/recipe";

export type RecipeForViewer =
  | { kind: "found"; recipe: RecipeDetailDto; isPreview: boolean }
  | { kind: "forbidden" }
  | { kind: "not-found" };

async function fetchRecipe(slug: string, token?: string): Promise<Response> {
  const url = `${API_V1}/recipes/${encodeURIComponent(slug)}`;
  return token
    ? fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" })
    : fetch(url, { next: { revalidate: 300, tags: ["recipes", `recipe:${slug}`] } });
}

async function read(response: Response): Promise<RecipeForViewer | null> {
  if (response.status === 404) return { kind: "not-found" };
  if (response.status === 403) return null;
  if (!response.ok) throw new Error(`Không tải được công thức (HTTP ${response.status}).`);
  return { kind: "found", recipe: (await response.json()) as RecipeDetailDto, isPreview: false };
}

/** cache(): generateMetadata và trang dùng chung một lần gọi trong cùng request. */
export const getRecipeForViewer = cache(async (slug: string): Promise<RecipeForViewer> => {
  const publicResult = await read(await fetchRecipe(slug));
  if (publicResult) return publicResult;

  // 403 = Draft/Archived: thử lại với quyền của người đang đăng nhập (nếu có).
  const session = await auth();
  if (!session?.accessToken) return { kind: "forbidden" };

  const ownerResult = await read(await fetchRecipe(slug, session.accessToken));
  if (!ownerResult) return { kind: "forbidden" };
  return ownerResult.kind === "found" ? { ...ownerResult, isPreview: true } : ownerResult;
});
