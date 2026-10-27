import type { ReactNode } from "react";
import { Inbox, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description?: ReactNode;
  icon?: LucideIcon;
  /** Nút hành động, ví dụ "Tạo công thức đầu tiên". */
  action?: ReactNode;
  className?: string;
}

/** Hiển thị khi danh sách rỗng (chưa có dữ liệu hoặc lọc không ra kết quả). */
export function EmptyState({ title, description, icon: Icon = Inbox, action, className }: EmptyStateProps) {
  return (
    <section
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-background px-6 py-12 text-center",
        className,
      )}
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-6" aria-hidden />
      </span>
      <div className="space-y-1">
        <h2 className="font-heading text-base font-semibold">{title}</h2>
        {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </section>
  );
}
