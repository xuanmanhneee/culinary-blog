import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Tiêu đề trang dùng chung. `align="center"` cho trang public (kiểu tạp chí),
 * `align="left"` cho dashboard và trang công cụ.
 */
export function PageHeader({ eyebrow, title, description, actions, align = "left", className }: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  if (align === "center") {
    return (
      <header className={cn("mx-auto max-w-3xl text-center", className)}>
        {eyebrow && <Badge variant="warm">{eyebrow}</Badge>}
        <h1 className="font-display mt-5 text-5xl font-bold tracking-[-.05em] text-foreground sm:text-6xl">{title}</h1>
        {description && <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">{description}</p>}
        {actions && <div className="mt-6 flex flex-wrap justify-center gap-2">{actions}</div>}
      </header>
    );
  }
  return (
    <header className={cn("flex flex-col justify-between gap-5 sm:flex-row sm:items-end", className)}>
      <div className="min-w-0">
        {eyebrow && <p className="text-xs font-bold uppercase tracking-[.15em] text-accent">{eyebrow}</p>}
        <h1 className="font-display mt-2 text-4xl font-bold tracking-[-.04em] text-foreground">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

/** Tiêu đề khối nội dung (h2) kèm hành động phụ. */
export function SectionHeader({ title, description, action }: { title: ReactNode; description?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h2 className="font-display text-3xl font-bold tracking-[-.03em] text-foreground">{title}</h2>
        {description && <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}
