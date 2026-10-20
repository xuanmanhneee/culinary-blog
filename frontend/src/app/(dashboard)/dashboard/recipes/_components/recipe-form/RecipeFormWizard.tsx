"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import ErrorState from "@/components/common/ErrorState";
import { RecipeStatusBadge } from "@/components/recipes/RecipeStatusBadge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api/client";
import { getErrorMessage } from "@/lib/api/problem";
import type { RecipeWithEtag } from "@/lib/api/recipe-management";
import { useCategories, useCreateRecipe, useRecipeForEdit, useSaveRecipeEdit } from "@/lib/hooks/useRecipeManagement";
import { RECIPE_FORM_STEPS, toCreateRecipeRequest, useRecipeFormStore } from "@/lib/stores/recipe-form-store";
import type { RecipeCategoryDto } from "@/lib/types/recipe";
import { BasicInfoStep } from "./BasicInfoStep";
import { IngredientsStep } from "./IngredientsStep";
import { ReviewStep } from "./ReviewStep";
import { firstStepWithErrors, type ServerErrors } from "./server-errors";
import { StepIndicator } from "./StepIndicator";
import { StepsStep } from "./StepsStep";

type RecipeFormWizardProps = { mode: "create"; recipeId?: undefined } | { mode: "edit"; recipeId: string };

/** Lỗi backend → lỗi theo field (400 validation, 409 trùng slug); null nếu không gắn được vào field nào. */
function toServerErrors(error: unknown): ServerErrors | null {
  if (!(error instanceof ApiError)) return null;
  if (error.problem.errors) return error.problem.errors;
  if (error.code === "RECIPE_SLUG_EXISTS") return { title: [getErrorMessage(error)] };
  return null;
}

/**
 * Form tạo/sửa công thức nhiều bước. Dữ liệu nằm trong recipe-form-store; lưu qua API:
 * tạo → POST /recipes (kèm nguyên liệu/các bước); sửa → PUT /recipes/{id} (If-Match) rồi đồng bộ
 * nguyên liệu/các bước (saveRecipeEdit).
 */
export function RecipeFormWizard({ mode, recipeId }: RecipeFormWizardProps) {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [serverErrors, setServerErrors] = useState<ServerErrors | null>(null);
  // Tăng khi nạp lại dữ liệu (xóa nháp, tải bản mới) để form của bước hiện tại mount lại.
  const [formVersion, setFormVersion] = useState(0);
  // Bản gốc + ETag tại thời điểm nạp vào form: dùng khi lưu để If-Match và phép đồng bộ khớp đúng
  // dữ liệu người dùng đang sửa (không dùng bản tải lại ở nền, tránh đè thay đổi của người khác).
  const base = useRef<RecipeWithEtag | null>(null);

  const currentStep = useRecipeFormStore((state) => state.currentStep);
  const completedSteps = useRecipeFormStore((state) => state.completedSteps);
  const goToStep = useRecipeFormStore((state) => state.goToStep);

  const categoriesQuery = useCategories();
  const recipeQuery = useRecipeForEdit(recipeId);
  const createRecipe = useCreateRecipe();
  const saveEdit = useSaveRecipeEdit(recipeId ?? "");
  const isSubmitting = createRecipe.isPending || saveEdit.isPending;

  const categories = useMemo<RecipeCategoryDto[]>(
    () => (categoriesQuery.data ?? []).map(({ id, name, slug }) => ({ id, name, slug })),
    [categoriesQuery.data],
  );

  // Tạo mới: đọc bản nháp từ sessionStorage sau khi mount (tránh lệch HTML với bản render ở server).
  useEffect(() => {
    if (mode !== "create") return;
    let cancelled = false;
    void Promise.resolve(useRecipeFormStore.persist.rehydrate()).then(() => {
      if (cancelled) return;
      useRecipeFormStore.getState().startCreate();
      setIsReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [mode]);

  // Sửa: nạp dữ liệu server vào form một lần, chỉ khi đã tải bản mới (không dùng cache cũ).
  const recipe = recipeQuery.data?.recipe;
  const freshData = recipeQuery.isFetchedAfterMount ? recipeQuery.data : undefined;
  useEffect(() => {
    if (mode !== "edit" || !freshData || base.current !== null) return;
    base.current = freshData;
    void Promise.resolve(useRecipeFormStore.persist.rehydrate()).then(() => {
      useRecipeFormStore.getState().loadFromRecipe(freshData.recipe);
      setIsReady(true);
    });
  }, [mode, freshData]);

  function showServerErrors(error: unknown) {
    const fieldErrors = toServerErrors(error);
    if (fieldErrors) {
      setServerErrors(fieldErrors);
      const step = firstStepWithErrors(fieldErrors);
      useRecipeFormStore.setState({ currentStep: step });
      setFormVersion((version) => version + 1);
      toast.error("Một số thông tin chưa hợp lệ, vui lòng kiểm tra lại.");
      return;
    }
    toast.error(getErrorMessage(error));
  }

  async function handleSubmit() {
    setServerErrors(null);
    const { draft } = useRecipeFormStore.getState();

    if (mode === "create") {
      try {
        const created = await createRecipe.mutateAsync(toCreateRecipeRequest(draft));
        useRecipeFormStore.getState().reset();
        toast.success(`Đã lưu bản nháp "${created.title}"`);
        router.push("/dashboard/recipes");
      } catch (error) {
        showServerErrors(error);
      }
      return;
    }

    if (!base.current) return;
    try {
      const saved = await saveEdit.mutateAsync({ original: base.current.recipe, draft, etag: base.current.etag });
      toast.success(`Đã lưu thay đổi cho "${saved.recipe.title}"`);
      router.push("/dashboard/recipes");
    } catch (error) {
      if (error instanceof ApiError && error.code === "RECIPE_CONCURRENCY_CONFLICT") {
        setConflict(true);
        return;
      }
      showServerErrors(error);
    }
  }

  async function reloadLatest() {
    const result = await recipeQuery.refetch();
    if (result.data) {
      base.current = result.data;
      useRecipeFormStore.getState().loadFromRecipe(result.data.recipe);
      setServerErrors(null);
      setFormVersion((version) => version + 1);
      toast.info("Đã tải bản mới nhất của công thức.");
    }
    setConflict(false);
  }

  if (mode === "edit" && recipeQuery.isError) {
    return (
      <div className="space-y-4">
        <BackLink />
        <ErrorState
          title="Không mở được công thức"
          message={getErrorMessage(recipeQuery.error)}
          onRetry={() => void recipeQuery.refetch()}
        />
      </div>
    );
  }

  const stepLabel = RECIPE_FORM_STEPS[currentStep]?.label;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <BackLink />
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-heading text-2xl font-semibold">
              {mode === "create" ? "Tạo công thức" : recipe ? `Sửa: ${recipe.title}` : "Sửa công thức"}
            </h1>
            {recipe && <RecipeStatusBadge status={recipe.status} />}
          </div>
          <p className="text-sm text-muted-foreground">
            Bước {currentStep + 1}/{RECIPE_FORM_STEPS.length}: {stepLabel}
            {mode === "create" && " · Bản nháp được lưu tạm trong trình duyệt cho tới khi bấm lưu."}
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
          <div key={`${currentStep}-${formVersion}`}>
            {currentStep === 0 && <BasicInfoStep categories={categories} serverErrors={serverErrors} />}
            {currentStep === 1 && <IngredientsStep serverErrors={serverErrors} />}
            {currentStep === 2 && <StepsStep serverErrors={serverErrors} />}
            {currentStep === 3 && (
              <ReviewStep
                categories={categories}
                isSubmitting={isSubmitting}
                onSubmit={() => void handleSubmit()}
                serverErrors={serverErrors}
              />
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
          setServerErrors(null);
          setFormVersion((version) => version + 1);
          setConfirmDiscard(false);
          toast.info("Đã xóa bản nháp");
        }}
      />

      <ConfirmDialog
        open={conflict}
        onOpenChange={setConflict}
        title="Công thức vừa được sửa ở nơi khác"
        description="Phiên bản bạn đang sửa đã cũ. Tải bản mới nhất sẽ thay thế các thay đổi chưa lưu trong form này."
        confirmLabel="Tải bản mới nhất"
        cancelLabel="Ở lại"
        isPending={recipeQuery.isFetching}
        onConfirm={() => void reloadLatest()}
      />
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/dashboard/recipes"
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="size-4" aria-hidden />
      Công thức của tôi
    </Link>
  );
}
