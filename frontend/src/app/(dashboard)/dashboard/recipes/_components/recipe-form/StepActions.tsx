import { ArrowLeft, ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface StepActionsProps {
  onBack?: () => void;
  /** Nút submit của form bước hiện tại; mặc định "Tiếp theo". */
  submitLabel?: ReactNode;
  isSubmitting?: boolean;
}

/** Thanh nút cuối mỗi bước: "Quay lại" (không kiểm tra) và submit (kiểm tra rồi sang bước sau). */
export function StepActions({ onBack, submitLabel, isSubmitting = false }: StepActionsProps) {
  return (
    <div className="flex items-center justify-between gap-3 border-t pt-4">
      {onBack ? (
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft />
          Quay lại
        </Button>
      ) : (
        <span />
      )}
      <Button type="submit" disabled={isSubmitting}>
        {submitLabel ?? (
          <>
            Tiếp theo
            <ArrowRight />
          </>
        )}
      </Button>
    </div>
  );
}
