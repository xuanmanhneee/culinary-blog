"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { ErrorState } from "@/components/common/ErrorState";
import { RecipeStatusBadge } from "@/components/recipes/RecipeStatusBadge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { refreshPublicRecipes } from "@/lib/actions/recipe-cache";
import { ApiError } from "@/lib/api/client";
import { getRecipeErrorMessage } from "@/lib/api/problem";
import { updateStep, uploadRecipeImage, type RecipeWithEtag } from "@/lib/api/recipe-management";
import { useCategories, useCreateRecipe, useRecipeForEdit, useSaveRecipeEdit } from "@/lib/hooks/useRecipeManagement";
import { useAccessToken } from "@/lib/hooks/useAccessToken";
import { RECIPE_FORM_STEPS, toCreateRecipeRequest, useRecipeFormStore, type StepDraft } from "@/lib/stores/recipe-form-store";
import type { RecipeCategoryDto, RecipeDetailDto, RecipeStepDto } from "@/lib/types/recipe";
import { RecipeImagesPanel } from "../RecipeImagesPanel";
import { RecipeStatusPanel } from "../RecipeStatusPanel";
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
  if (error.code === "RECIPE_SLUG_EXISTS") return { title: [getRecipeErrorMessage(error)] };
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
  // Thông báo chung phía trên form (dự án không dùng thư viện toast).
  const [notice, setNotice] = useState<{ tone: "error" | "info"; text: string } | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [stepImages, setStepImages] = useState<Record<string, File>>({});
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
  const { token } = useAccessToken();
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
      setNotice({ tone: "error", text: "Một số thông tin chưa hợp lệ, vui lòng kiểm tra lại." });
      return;
    }
    setNotice({ tone: "error", text: getRecipeErrorMessage(error) });
  }

  async function handleSubmit() {
    setServerErrors(null);
    setNotice(null);
    const { draft } = useRecipeFormStore.getState();

    if (mode === "create") {
      try {
        const created = await createRecipe.mutateAsync(toCreateRecipeRequest(draft));
        if (coverImage) {
          try {
            await uploadRecipeImage(created.id, coverImage, token);
          } catch {
            setNotice({ tone: "info", text: "Đã tạo công thức nhưng ảnh chưa tải lên được. Bạn có thể thêm ảnh sau." });
          }
        }
        await uploadStepImages(created.id, created.steps, draft.steps, stepImages, token);
        await refreshPublicRecipes();
        useRecipeFormStore.getState().reset();
        router.push(`/dashboard/recipes?notice=created&title=${encodeURIComponent(created.title)}`);
      } catch (error) {
        showServerErrors(error);
      }
      return;
    }

    if (!base.current) return;
    try {
      const saved = await saveEdit.mutateAsync({ original: base.current.recipe, draft, etag: base.current.etag });
      // Ảnh của các bước chọn trong form sửa: tải lên sau khi đã đồng bộ các bước.
      await uploadStepImages(saved.recipe.id, saved.recipe.steps, draft.steps, stepImages, token);
      await refreshPublicRecipes();
      router.push(`/dashboard/recipes?notice=updated&title=${encodeURIComponent(saved.recipe.title)}`);
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
      setNotice({ tone: "info", text: "Đã tải bản mới nhất của công thức." });
    }
    setConflict(false);
  }

  if (mode === "edit" && recipeQuery.isError) {
    return (
      <div className="space-y-4">
        <BackLink />
        <ErrorState
          title="Không mở được công thức"
          message={getRecipeErrorMessage(recipeQuery.error)}
          onRetry={() => void recipeQuery.refetch()}
        />
      </div>
    );
  }

  /** Đổi trạng thái làm RowVersion mới: cập nhật bản gốc để lần lưu form sau không bị báo xung đột. */
  function handleStatusChanged(updated: RecipeDetailDto) {
    if (base.current) {
      base.current = {
        recipe: { ...base.current.recipe, status: updated.status, publishedAt: updated.publishedAt, rowVersion: updated.rowVersion },
        etag: `"${updated.rowVersion}"`,
      };
    }
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

      {notice && (
        <p
          role={notice.tone === "error" ? "alert" : "status"}
          className={
            notice.tone === "error"
              ? "rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              : "rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          }
        >
          {notice.text}
        </p>
      )}

      {mode === "edit" && recipe && (
        <>
          <RecipeStatusPanel recipe={recipe} onStatusChanged={handleStatusChanged} />
          <RecipeImagesPanel recipeId={recipe.id} title={recipe.title} images={recipe.images} />
        </>
      )}

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
            {currentStep === 0 && <BasicInfoStep categories={categories} serverErrors={serverErrors} {...(mode === "create" ? { selectedImage: coverImage, onImageSelected: setCoverImage } : {})} />}
            {currentStep === 1 && <IngredientsStep serverErrors={serverErrors} />}
            {currentStep === 2 && <StepsStep serverErrors={serverErrors} selectedImages={stepImages} onImageSelected={(key, file) => setStepImages((current) => ({ ...current, ...(file ? { [key]: file } : {}) }))} />}
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
          setCoverImage(null);
          setStepImages({});
          setServerErrors(null);
          setFormVersion((version) => version + 1);
          setConfirmDiscard(false);
          setNotice({ tone: "info", text: "Đã xóa bản nháp." });
        }}
      />

      <ConfirmDialog
        open={conflict}
        onOpenChange={setConflict}
        title="Công thức vừa được sửa ở nơi khác"
        description="Phiên bản bạn đang sửa đã cũ. Tải bản mới nhất sẽ thay thế các thay đổi chưa lưu trong form này."
        confirmLabel="Tải bản mới nhất"
        cancelLabel="Ở lại"
        onConfirm={() => void reloadLatest()}
      />
    </div>
  );
}

async function uploadStepImages(
  recipeId: string,
  createdSteps: RecipeStepDto[],
  draftSteps: StepDraft[],
  files: Record<string, File>,
  token: string | null | undefined,
) {
  const orderedCreatedSteps = [...createdSteps].sort((left, right) => left.stepNumber - right.stepNumber);
  await Promise.allSettled(draftSteps.map(async (draftStep, index) => {
    const file = files[draftStep.key];
    const createdStep = orderedCreatedSteps[index];
    if (!file || !createdStep) return;

    const uploaded = await uploadRecipeImage(recipeId, file, token);
    await updateStep(recipeId, createdStep.id, {
      title: createdStep.title,
      description: createdStep.description,
      timerMinutes: createdStep.timerMinutes,
      imageUrl: uploaded.url,
    }, token);
  }));
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
