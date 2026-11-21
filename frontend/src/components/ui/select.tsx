"use client";

import type { ReactNode } from "react";
import { fieldClass } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function Select({ children, value, onValueChange, className, ...props }: { children: ReactNode; value?: string; onValueChange?: (value: string) => void; className?: string }) {
  return <select {...props} value={value} onChange={(event) => onValueChange?.(event.target.value)} className={cn(fieldClass, className)}>{children}</select>;
}
export function SelectTrigger({ children }: { children: ReactNode }) { return <>{children}</>; }
export function SelectValue({ placeholder }: { placeholder?: string }) { return <>{placeholder}</>; }
export function SelectContent({ children }: { children: ReactNode }) { return <>{children}</>; }
export function SelectItem({ value, children }: { value: string; children: ReactNode }) { return <option value={value}>{children}</option>; }
