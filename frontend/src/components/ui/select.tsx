"use client";

import type { HTMLAttributes, ReactNode } from "react";

export function Select({ children, value, onValueChange, ...props }: { children: ReactNode; value?: string; onValueChange?: (value: string) => void }) {
  return <select {...props} value={value} onChange={(event) => onValueChange?.(event.target.value)} className="h-9 w-full rounded-md border bg-transparent px-3 text-sm">{children}</select>;
}
export function SelectTrigger({ children, ...props }: HTMLAttributes<HTMLDivElement>) { return <>{children}</>; }
export function SelectValue({ placeholder }: { placeholder?: string }) { return <>{placeholder}</>; }
export function SelectContent({ children }: { children: ReactNode }) { return <>{children}</>; }
export function SelectItem({ value, children }: { value: string; children: ReactNode }) { return <option value={value}>{children}</option>; }
