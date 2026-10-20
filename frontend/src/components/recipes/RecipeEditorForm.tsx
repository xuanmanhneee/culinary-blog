import { ImagePlus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RecipeEditorForm({ mode = "create" }: { mode?: "create" | "edit" }) {
  return (
    <form className="mt-8 space-y-6" action="#">
      <div className="grid gap-6 rounded-[1.5rem] border border-[#ddd1c3] bg-white/75 p-6 sm:p-8">
        <div><label className="form-label" htmlFor="title">Tên món</label><input id="title" className="form-input" placeholder="Ví dụ: Cá kho tộ của mẹ" defaultValue={mode === "edit" ? "Bún chả Hà Nội thơm lừng căn bếp" : ""} /></div>
        <div><label className="form-label" htmlFor="description">Mô tả ngắn</label><textarea id="description" rows={4} className="form-input resize-none py-3" placeholder="Điều gì làm món ăn này đặc biệt?" defaultValue={mode === "edit" ? "Chả nướng xém cạnh, nước mắm chua ngọt và một rổ rau xanh mát." : ""} /></div>
        <div className="grid gap-5 sm:grid-cols-2"><div><label className="form-label" htmlFor="category">Danh mục</label><select id="category" className="form-input"><option>Món Việt</option><option>Món chay</option><option>Làm bánh</option></select></div><div><label className="form-label" htmlFor="difficulty">Độ khó</label><select id="difficulty" className="form-input"><option>Dễ</option><option>Trung bình</option><option>Khó</option></select></div></div>
        <div className="grid gap-5 sm:grid-cols-3"><div><label className="form-label" htmlFor="prep">Chuẩn bị (phút)</label><input id="prep" type="number" className="form-input" defaultValue="15" /></div><div><label className="form-label" htmlFor="cook">Nấu (phút)</label><input id="cook" type="number" className="form-input" defaultValue="30" /></div><div><label className="form-label" htmlFor="servings">Khẩu phần</label><input id="servings" type="number" className="form-input" defaultValue="4" /></div></div>
      </div>
      <div className="rounded-[1.5rem] border-2 border-dashed border-[#d4c6b7] bg-[#f6eee5] px-6 py-10 text-center"><ImagePlus className="mx-auto size-8 text-[#b65338]" /><p className="mt-3 font-bold text-[#49423c]">Thêm ảnh đại diện</p><p className="mt-1 text-xs text-[#81766d]">Kéo thả hoặc chọn ảnh JPEG, PNG, WebP — tối đa 5 MB</p><Button type="button" variant="outline" size="sm" className="mt-4">Chọn ảnh</Button></div>
      <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row"><Button type="button" variant="outline">Lưu bản nháp</Button><Button type="submit"><Save />{mode === "edit" ? "Lưu thay đổi" : "Tạo công thức"}</Button></div>
    </form>
  );
}
