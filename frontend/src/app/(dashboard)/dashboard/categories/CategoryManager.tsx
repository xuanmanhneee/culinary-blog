"use client";

import { Loader2, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCategory, deleteCategory, updateCategory } from "@/lib/api/categories";
import { getErrorMessage } from "@/lib/errors";
import { useAccessToken } from "@/lib/hooks/useAccessToken";
import type { CategoryDto } from "@/lib/types/category";

export function CategoryManager({ initialCategories }: { initialCategories: CategoryDto[] }) {
  const { token } = useAccessToken();
  const [categories, setCategories] = useState(initialCategories);
  const [editing, setEditing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<CategoryDto | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ error: boolean; text: string } | null>(null);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setBusy("create");
    setMessage(null);
    try {
      const created = await createCategory({
        name: String(form.get("name") ?? ""),
        slug: String(form.get("slug") ?? ""),
        description: optional(form.get("description")),
        imageUrl: optional(form.get("imageUrl")),
        orderIndex: Number(form.get("orderIndex")) || 0,
      }, token);
      setCategories((current) => sortCategories([...current, created]));
      formElement.reset();
      setMessage({ error: false, text: "Đã tạo danh mục." });
    } catch (error) {
      setMessage({ error: true, text: getErrorMessage(error) });
    } finally {
      setBusy(null);
    }
  }

  async function update(event: FormEvent<HTMLFormElement>, category: CategoryDto) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(category.id);
    setMessage(null);
    try {
      const updated = await updateCategory(category.id, {
        name: String(form.get("name") ?? ""),
        description: optional(form.get("description")),
        imageUrl: optional(form.get("imageUrl")),
        orderIndex: Number(form.get("orderIndex")) || 0,
      }, token);
      setCategories((current) => sortCategories(current.map((item) => item.id === updated.id ? updated : item)));
      setEditing(null);
      setMessage({ error: false, text: "Đã cập nhật danh mục." });
    } catch (error) {
      setMessage({ error: true, text: getErrorMessage(error) });
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    if (!deleting) return;
    const target = deleting;
    setDeleting(null);
    setBusy(target.id);
    setMessage(null);
    try {
      await deleteCategory(target.id, token);
      setCategories((current) => current.filter((item) => item.id !== target.id));
      setMessage({ error: false, text: "Đã xóa danh mục." });
    } catch (error) {
      setMessage({ error: true, text: getErrorMessage(error) });
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="space-y-7">
      <header>
        <p className="text-xs font-bold uppercase tracking-[.15em] text-[#a84f37]">Quản trị nội dung</p>
        <h1 className="font-display mt-2 text-4xl font-bold tracking-[-.04em] text-[#29231f]">Danh mục</h1>
        <p className="mt-2 text-sm text-[#786e66]">Tạo, cập nhật và sắp xếp các nhóm công thức.</p>
      </header>

      {message && <p role={message.error ? "alert" : "status"} className={`rounded-xl border px-4 py-3 text-sm ${message.error ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>{message.text}</p>}

      <form onSubmit={create} className="grid gap-4 rounded-[1.5rem] border border-[#ddd1c3] bg-[#fffdf9] p-5 shadow-[0_12px_35px_rgba(75,57,41,.05)] md:grid-cols-2 lg:grid-cols-5 lg:items-end">
        <Field label="Tên"><Input name="name" required minLength={2} maxLength={100} /></Field>
        <Field label="Slug"><Input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="mon-viet" /></Field>
        <Field label="Mô tả"><Input name="description" maxLength={500} /></Field>
        <Field label="URL ảnh"><Input name="imageUrl" type="url" /></Field>
        <div className="flex items-end gap-2"><Field label="Thứ tự"><Input name="orderIndex" type="number" min={0} defaultValue={categories.length} /></Field><Button type="submit" disabled={busy !== null}>{busy === "create" ? <Loader2 className="animate-spin" /> : <Plus />}Tạo</Button></div>
      </form>

      <div className="space-y-3">
        {categories.map((category) => editing === category.id ? (
          <form key={category.id} onSubmit={(event) => update(event, category)} className="grid gap-3 rounded-2xl border border-[#b8cfc2] bg-[#f4faf6] p-4 md:grid-cols-2 lg:grid-cols-[1fr_1.5fr_1.5fr_100px_auto] lg:items-end">
            <Field label="Tên"><Input name="name" required minLength={2} maxLength={100} defaultValue={category.name} /></Field>
            <Field label="Mô tả"><Input name="description" maxLength={500} defaultValue={category.description ?? ""} /></Field>
            <Field label="URL ảnh"><Input name="imageUrl" type="url" defaultValue={category.imageUrl ?? ""} /></Field>
            <Field label="Thứ tự"><Input name="orderIndex" type="number" min={0} defaultValue={category.orderIndex} /></Field>
            <div className="flex gap-2"><Button type="submit" size="sm" disabled={busy !== null}>{busy === category.id ? <Loader2 className="animate-spin" /> : <Save />}Lưu</Button><Button type="button" size="sm" variant="ghost" onClick={() => setEditing(null)}><X />Hủy</Button></div>
          </form>
        ) : (
          <article key={category.id} className="flex flex-col gap-4 rounded-2xl border border-[#ddd1c3] bg-[#fffdf9] p-4 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-display text-xl font-bold text-[#342e29]">{category.name}</h2><Badge variant="outline">/{category.slug}</Badge><Badge variant="warm">{category.recipeCount} công thức</Badge></div><p className="mt-1 text-sm text-[#786e66]">{category.description || "Chưa có mô tả"}</p></div>
            <span className="text-xs font-semibold text-[#82786f]">Thứ tự {category.orderIndex}</span>
            <div className="flex gap-2"><Button type="button" size="sm" variant="outline" disabled={busy !== null} onClick={() => setEditing(category.id)}><Pencil />Sửa</Button><Button type="button" size="sm" variant="ghost" className="text-red-700" disabled={busy !== null} onClick={() => setDeleting(category)}>{busy === category.id ? <Loader2 className="animate-spin" /> : <Trash2 />}Xóa</Button></div>
          </article>
        ))}
      </div>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Xóa danh mục?"
        description={deleting?.recipeCount ? "Danh mục còn công thức nên hệ thống sẽ từ chối xóa." : `Danh mục “${deleting?.name ?? ""}” sẽ bị xóa.`}
        confirmLabel="Xóa danh mục"
        destructive
        onConfirm={() => void remove()}
      />
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <Label className="block space-y-2"><span>{label}</span>{children}</Label>;
}

function optional(value: FormDataEntryValue | null): string | null {
  const text = String(value ?? "").trim();
  return text || null;
}

function sortCategories(categories: CategoryDto[]): CategoryDto[] {
  return [...categories].sort((left, right) => left.orderIndex - right.orderIndex || left.name.localeCompare(right.name, "vi"));
}
