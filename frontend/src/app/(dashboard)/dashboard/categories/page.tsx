import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getCategories } from "@/lib/api/categories";
import { Roles } from "@/lib/types/auth";
import { CategoryManager } from "./CategoryManager";

export const metadata: Metadata = { title: "Quản lý danh mục" };

export default async function CategoriesAdminPage() {
  const session = await auth();
  if (!session?.user.roles?.includes(Roles.Admin)) redirect("/dashboard/recipes");
  const categories = await getCategories();
  return <CategoryManager initialCategories={categories} />;
}
