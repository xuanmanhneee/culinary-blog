"use client";

import type { ReactNode } from "react";

interface ConfirmDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
}

export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel = "Xác nhận", cancelLabel = "Hủy", destructive, onConfirm }: ConfirmDialogProps) {
  if (!open) return null;
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
    <div className="w-full max-w-sm rounded-xl bg-background p-5 shadow-xl">
      <h2 id="confirm-title" className="font-semibold">{title}</h2>
      <div className="mt-2 text-sm text-muted-foreground">{description}</div>
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" className="rounded-md border px-3 py-2 text-sm" onClick={() => onOpenChange?.(false)}>{cancelLabel}</button>
        <button type="button" className={`rounded-md px-3 py-2 text-sm text-white ${destructive ? "bg-red-600" : "bg-emerald-700"}`} onClick={onConfirm}>{confirmLabel}</button>
      </div>
    </div>
  </div>;
}
