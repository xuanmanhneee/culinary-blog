import { BookOpen, FolderTree, PlusCircle, type LucideIcon } from "lucide-react";
import { Roles, type Role } from "@/lib/types/auth";

export interface DashboardNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Bỏ trống: mọi người dùng dashboard (Author/Admin) đều thấy. */
  roles?: Role[];
  /** Trang con thuộc mục khác, không tính là active (ví dụ /recipes/new thuộc "Tạo công thức"). */
  excludes?: string[];
}

/** Menu khu quản trị (SRS 5.1: /dashboard/recipes, /dashboard/recipes/new, /dashboard/categories). */
export const dashboardNavItems: DashboardNavItem[] = [
  {
    href: "/dashboard/recipes",
    label: "Công thức của tôi",
    icon: BookOpen,
    excludes: ["/dashboard/recipes/new"],
  },
  { href: "/dashboard/recipes/new", label: "Tạo công thức", icon: PlusCircle },
  { href: "/dashboard/categories", label: "Danh mục", icon: FolderTree, roles: [Roles.Admin] },
];

export function visibleNavItems(roles: readonly Role[]): DashboardNavItem[] {
  return dashboardNavItems.filter((item) => !item.roles || item.roles.some((role) => roles.includes(role)));
}

function isUnder(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Active khi đang ở đúng trang hoặc trang con (trang sửa công thức thuộc "Công thức của tôi"). */
export function isNavItemActive(item: DashboardNavItem, pathname: string): boolean {
  return isUnder(pathname, item.href) && !item.excludes?.some((excluded) => isUnder(pathname, excluded));
}
