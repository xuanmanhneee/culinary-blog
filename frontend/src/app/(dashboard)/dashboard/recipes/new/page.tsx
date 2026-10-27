import type { Metadata } from "next";
import { RecipeEditorForm } from "@/components/recipes/RecipeEditorForm";

export const metadata: Metadata = { title: "Tạo công thức" };

export default function NewRecipePage() { return <section><p className="text-xs font-bold uppercase tracking-[.15em] text-[#a84f37]">Chia sẻ món ngon</p><h2 className="font-display mt-2 text-4xl font-bold tracking-[-.04em]">Tạo công thức mới</h2><p className="mt-2 text-sm text-[#786e66]">Bắt đầu với thông tin cơ bản. Bạn có thể bổ sung nguyên liệu và các bước sau.</p><RecipeEditorForm /></section>; }
