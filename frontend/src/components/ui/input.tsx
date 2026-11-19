import * as React from "react";
import { cn } from "@/lib/utils";

export const fieldClass = "h-11 w-full min-w-0 rounded-xl border border-input bg-card px-4 text-sm text-foreground outline-none transition-colors placeholder:text-subtle focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 file:border-0 file:bg-transparent file:text-sm file:font-medium";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return <input type={type} data-slot="input" className={cn(fieldClass, className)} {...props} />;
}

export { Input };
