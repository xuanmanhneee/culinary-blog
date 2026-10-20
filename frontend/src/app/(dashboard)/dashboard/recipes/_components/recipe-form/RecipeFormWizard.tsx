"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { RecipeStatusBadge } from "@/components/recipes/RecipeStatusBadge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RECIPE_FORM_STEPS, useRecipeFormStore } from "@/lib/stores/recipe-form-store";
import type { RecipeCategoryDto, RecipeDetailDto } from "@/lib/types/recipe";
import { BasicInfoStep } from "./BasicInfoStep";
import { IngredientsStep } from "./IngredientsStep";
import { ReviewStep } from "./ReviewStep";
import { StepIndicator } from "./StepIndicator";
import { StepsStep } from "./StepsStep";

type RecipeFormWizardProps =
  | { mode: "create"; categories: RecipeCategoryDto[]; recipe?: undefined }
  | { mode: "edit"; categories: RecipeCategoryDto[]; recipe: RecipeDetailDto };

/**
 * Form tạo/sửa công thức nhiều bước. Dữ liệu nằm trong recipe-form-store; giao diện tĩnh nên bấm lưu
 * chỉ thông báo và quay về danh sách (gọi API thực hiện ở branch nối API).
 */
export function RecipeFormWizard({ mode, categories, recipe }: RecipeFormWizardProps) {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Tăng khi xóa bản nháp để form của bước hiện tại mount lại với dữ liệu trống.
  const [resetCount, setResetCount] = useState(0);

  const currentStep = useRecipeFormStore((state) => state.currentStep);
  const completedSteps = useRecipeFormStore((state) => state.completedSteps);
  const goToStep = useRecipeFormStore((state) => state.goToStep);

  // Đọc bản nháp từ sessionStorage sau khi mount (tránh lệch HTML với bản render ở server),
  // rồi chuyển store sang đúng chế độ của trang.
  useEffect(() => {
    let cancelled = false;
    void Promise.resolve(useRecipeFormStore.persist.rehydrate()).then(() => {
      if (cancelled) return;
      const store = useRecipeFormStore.getState();
      if (mode === "edit") store.loadFromRecipe(recipe);
      else store.startCreate();
      setIsReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [mode, recipe]);

  function handleSubmit() {
    setIsSubmitting(true);
    // Giao diện tĩnh: giả lập lưu thành công.
    window.setTimeout(() => {
      const { draft } = useRecipeFormStore.getState();
      if (mode === "create") {
        toast.success(`Đã lưu bản nháp "${draft.basic.title}"`, {
          description: "Dữ liệu mẫu – chưa gửi lên server.",
        });
        useRecipeFormStore.getState().reset();
      } else {
        toast.success(`Đã lưu thay đổi cho "${draft.basic.title}"`, {
          description: "Dữ liệu mẫu – chưa gửi lên server.",
        });
      }
      setIsSubmitting(false);
      router.push("/dashboard/recipes");
    }, 400);
  }

  const stepLabel = RECIPE_FORM_STEPS[currentStep]?.label;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/dashboard/recipes"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Công thức của tôi
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-heading text-2xl font-semibold">
              {mode === "create" ? "Tạo công thức" : `Sửa: ${recipe.title}`}
            </h1>
            {mode === "edit" && <RecipeStatusBadge status={recipe.status} />}
          </div>
          <p className="text-sm text-muted-foreground">
            Bước {currentStep + 1}/{RECIPE_FORM_STEPS.length}: {stepLabel}
            {mode === "create" && " · Bản nháp được lưu tạm trong trình duyệt."}
          </p>
        </div>
        {mode === "create" && (
          <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmDiscard(true)}>
            <RotateCcw />
            Làm lại từ đầu
          </Button>
        )}
      </div>

      <StepIndicator currentStep={currentStep} completedSteps={completedSteps} onSelect={goToStep} />

      <div className="rounded-xl border bg-background p-4 sm:p-6">
        {!isReady ? (
          <div className="space-y-4" aria-busy="true">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-9 w-2/3" />
          </div>
        ) : (
          // key: mount lại form của bước để defaultValues lấy đúng dữ liệu mới nhất trong store.
          <div key={`${currentStep}-${resetCount}`}>
            {currentStep === 0 && <BasicInfoStep categories={categories} />}
            {currentStep === 1 && <IngredientsStep />}
            {currentStep === 2 && <StepsStep />}
            {currentStep === 3 && (
              <ReviewStep categories={categories} isSubmitting={isSubmitting} onSubmit={handleSubmit} />
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmDiscard}
        onOpenChange={setConfirmDiscard}
        title="Xóa bản nháp?"
        description="Toàn bộ thông tin đã nhập sẽ bị xóa và form trở về trống."
        confirmLabel="Xóa bản nháp"
        destructive
        onConfirm={() => {
          useRecipeFormStore.getState().startCreate(true);
          setResetCount((count) => count + 1);
          setConfirmDiscard(false);
          toast.info("Đã xóa bản nháp");
        }}
      />
    </div>
  );
}
