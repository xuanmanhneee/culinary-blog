import type { Metadata } from "next";

interface EditRecipePageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Sửa công thức",
};

/**
 * /dashboard/recipes/[id]/edit – sửa công thức theo id (không theo slug vì slug đổi khi còn Draft).
 * Dữ liệu: GET /api/v1/recipes/{id} lấy ETag, PUT kèm If-Match (FR-RCP-004);
 * nguyên liệu, bước, ảnh qua FR-RCP-009/010/008.
 */
export default async function EditRecipePage({ params }: EditRecipePageProps) {
  const { id } = await params;

  return (
    <section className="space-y-2">
      <h2 className="text-lg font-medium">Sửa công thức</h2>
      <p className="text-sm text-zinc-600">
        Form sửa công thức <code className="rounded bg-zinc-100 px-1">{id}</code> đang được xây dựng.
      </p>
    </section>
  );
}
