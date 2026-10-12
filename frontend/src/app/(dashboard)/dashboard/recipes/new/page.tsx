import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tạo công thức",
};

/**
 * /dashboard/recipes/new – form tạo công thức (FR-RCP-003): React Hook Form + Zod,
 * gửi POST /api/v1/recipes; recipe mới ở trạng thái Draft.
 */
export default function NewRecipePage() {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-medium">Tạo công thức</h2>
      <p className="text-sm text-zinc-600">Form tạo công thức đang được xây dựng.</p>
    </section>
  );
}
