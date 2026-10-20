import type { Metadata } from "next";
import { RecipeEditorForm } from "@/components/recipes/RecipeEditorForm";

export const metadata: Metadata = { title: "Sửa công thức" };

export default async function EditRecipePage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <section><p className="text-xs font-bold uppercase tracking-[.15em] text-[#a84f37]">Công thức #{id}</p><h2 className="font-display mt-2 text-4xl font-bold tracking-[-.04em]">Chỉnh sửa công thức</h2><p className="mt-2 text-sm text-[#786e66]">Cập nhật câu chuyện và thông tin món ăn của bạn.</p><RecipeEditorForm mode="edit" /></section>; }
