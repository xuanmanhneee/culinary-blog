"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { RECIPE_FORM_STEPS } from "@/lib/stores/recipe-form-store";

interface StepIndicatorProps {
  currentStep: number;
  completedSteps: number[];
  onSelect: (step: number) => void;
}

/** Thanh tiến trình 4 bước; chỉ bấm được bước đã hoàn thành hoặc bước ngay sau đó. */
export function StepIndicator({ currentStep, completedSteps, onSelect }: StepIndicatorProps) {
  return (
    <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Các bước tạo công thức">
      {RECIPE_FORM_STEPS.map((step, index) => {
        const isCurrent = index === currentStep;
        const isDone = completedSteps.includes(index);
        const isReachable = index <= currentStep || completedSteps.includes(index - 1);

        return (
          <li key={step.id}>
            <button
              type="button"
              onClick={() => onSelect(index)}
              disabled={!isReachable}
              aria-current={isCurrent ? "step" : undefined}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                isCurrent && "border-emerald-600 bg-emerald-50 text-emerald-900",
                !isCurrent && isReachable && "bg-background hover:bg-muted",
                !isReachable && "cursor-not-allowed bg-muted/50 text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                  isDone && !isCurrent && "border-emerald-600 bg-emerald-600 text-white",
                  isCurrent && "border-emerald-600 text-emerald-700",
                )}
              >
                {isDone && !isCurrent ? <Check className="size-4" aria-hidden /> : index + 1}
              </span>
              <span className="font-medium">{step.label}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
