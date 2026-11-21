"use client";

import { ImagePlus, Loader2, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCategory, deleteCategory, updateCategory, uploadCategoryImage } from "@/lib/api/categories";
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
    let created: CategoryDto | null = null;
    try {
      const baseCategory = await createCategory({
        name: String(form.get("name") ?? ""),
        description: optional(form.get("description")),
        imageUrl: null,
        orderIndex: nextOrderIndex(categories),
      }, token);
      created = baseCategory;
      const image = selectedImage(form);
      const saved = image ? await uploadCategoryImage(baseCategory.id, image, token) : baseCategory;
      created = saved;
      setCategories((current) => sortCategories([...current, saved]));
      formElement.reset();
      setMessage({ error: false, text: "Đã tạo danh mục." });
    } catch (error) {
      if (created) {
        setCategories((current) => sortCategories([...current, created!]).filter((item, index, all) => all.findIndex(({ id }) => id === item.id) === index));
        formElement.reset();
        setMessage({ error: true, text: `Đã tạo danh mục nhưng tải ảnh thất bại: ${getErrorMessage(error)}` });
      } else {
        setMessage({ error: true, text: getErrorMessage(error) });
      }
    } finally {
      setBusy(null);
    }
  }

  async function update(event: FormEvent<HTMLFormElement>, category: CategoryDto) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(category.id);
    setMessage(null);
    let updated: CategoryDto | null = null;
    try {
      const baseCategory = await updateCategory(category.id, {
        name: String(form.get("name") ?? ""),
        description: optional(form.get("description")),
        imageUrl: category.imageUrl,
        orderIndex: category.orderIndex,
      }, token);
      const updatedCategory = { ...baseCategory, recipeCount: category.recipeCount };
      updated = updatedCategory;
      const image = selectedImage(form);
      const saved = {
        ...(image ? await uploadCategoryImage(category.id, image, token) : updatedCategory),
        recipeCount: category.recipeCount,
      };
      updated = saved;
      setCategories((current) => sortCategories(current.map((item) => item.id === saved.id ? saved : item)));
      setEditing(null);
      setMessage({ error: false, text: "Đã cập nhật danh mục." });
    } catch (error) {
      if (updated) {
        setCategories((current) => sortCategories(current.map((item) => item.id === updated!.id ? updated! : item)));
        setEditing(null);
        setMessage({ error: true, text: `Đã lưu thông tin nhưng tải ảnh thất bại: ${getErrorMessage(error)}` });
      } else {
        setMessage({ error: true, text: getErrorMessage(error) });
      }
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
      <PageHeader eyebrow="Quản trị" title="Danh mục" description="Tạo và cập nhật các nhóm công thức." />

      {message && <p role={message.error ? "alert" : "status"} className={`rounded-xl border px-4 py-3 text-sm ${message.error ? "border-destructive/10 bg-destructive/10 text-destructive" : "border-primary-soft bg-primary-soft text-primary"}`}>{message.text}</p>}

      <form onSubmit={create} className="grid gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm md:grid-cols-2 lg:grid-cols-[1fr_1.5fr_1fr_auto] lg:items-end">
        <Field label="Tên"><Input name="name" required minLength={2} maxLength={100} /></Field>
        <Field label="Mô tả"><Input name="description" maxLength={500} /></Field>
        <ImageField />
        <Button type="submit" disabled={busy !== null}>{busy === "create" ? <Loader2 className="animate-spin" /> : <Plus />}Tạo</Button>
      </form>

      <div className="space-y-3">
        {categories.map((category) => editing === category.id ? (
          <form key={category.id} onSubmit={(event) => update(event, category)} className="grid gap-3 rounded-2xl border border-primary-soft bg-primary-soft p-4 md:grid-cols-2 lg:grid-cols-[1fr_1.5fr_1fr_auto] lg:items-end">
            <Field label="Tên"><Input name="name" required minLength={2} maxLength={100} defaultValue={category.name} /></Field>
            <Field label="Mô tả"><Input name="description" maxLength={500} defaultValue={category.description ?? ""} /></Field>
            <ImageField hasImage={Boolean(category.imageUrl)} />
            <div className="flex gap-2"><Button type="submit" size="sm" disabled={busy !== null}>{busy === category.id ? <Loader2 className="animate-spin" /> : <Save />}Lưu</Button><Button type="button" size="sm" variant="ghost" onClick={() => setEditing(null)}><X />Hủy</Button></div>
          </form>
        ) : (
          <article key={category.id} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-bold text-foreground">{category.name}</h2><Badge variant="outline">/{category.slug}</Badge><Badge variant="warm">{category.recipeCount} công thức</Badge></div><p className="mt-1 text-sm text-muted-foreground">{category.description || "Chưa có mô tả"}</p></div>
            <div className="flex gap-2"><Button type="button" size="sm" variant="outline" disabled={busy !== null} onClick={() => setEditing(category.id)}><Pencil />Sửa</Button><span title={category.recipeCount > 0 ? "Không thể xóa khi danh mục còn chứa công thức." : undefined}><Button type="button" size="sm" variant="ghost" className="text-destructive" disabled={busy !== null || category.recipeCount > 0} onClick={() => setDeleting(category)}>{busy === category.id ? <Loader2 className="animate-spin" /> : <Trash2 />}Xóa</Button></span></div>
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

function ImageField({ hasImage = false }: { hasImage?: boolean }) {
  return <Field label={hasImage ? "Ảnh (để trống nếu giữ ảnh cũ)" : "Ảnh"}><div className="relative"><ImagePlus className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" /><Input name="image" type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="pl-9 file:mr-3 file:border-0 file:bg-transparent file:font-semibold" /></div></Field>;
}

function optional(value: FormDataEntryValue | null): string | null {
  const text = String(value ?? "").trim();
  return text || null;
}

function selectedImage(form: FormData): File | null {
  const file = form.get("image");
  return file instanceof File && file.size > 0 ? file : null;
}

function nextOrderIndex(categories: CategoryDto[]): number {
  return Math.max(-1, ...categories.map((category) => category.orderIndex)) + 1;
}

function sortCategories(categories: CategoryDto[]): CategoryDto[] {
  return [...categories].sort((left, right) => left.orderIndex - right.orderIndex || left.name.localeCompare(right.name, "vi"));
}
