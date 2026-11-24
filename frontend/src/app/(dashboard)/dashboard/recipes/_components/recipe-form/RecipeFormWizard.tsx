"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, RotateCcw, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { ErrorState } from "@/components/common/ErrorState";
import { SAMPLE_RECIPES } from "@/lib/demo/sample-recipes";
import { RecipeStatusBadge } from "@/components/recipes/RecipeStatusBadge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { refreshPublicRecipes } from "@/lib/actions/recipe-cache";
import { ApiError } from "@/lib/api/client";
import { getRecipeErrorMessage } from "@/lib/api/problem";
import { changeRecipeStatus, updateStep, uploadRecipeImage, type RecipeWithEtag } from "@/lib/api/recipe-management";
import { useCategories, useCreateRecipe, useRecipeForEdit, useSaveRecipeEdit } from "@/lib/hooks/useRecipeManagement";
import { useAccessToken } from "@/lib/hooks/useAccessToken";
import { RECIPE_FORM_STEPS, toCreateRecipeRequest, useRecipeFormStore, type StepDraft } from "@/lib/stores/recipe-form-store";
import type { RecipeCategoryDto, RecipeDetailDto, RecipeStepDto } from "@/lib/types/recipe";
import { Roles } from "@/lib/types/auth";
import { RecipeImagesPanel } from "../RecipeImagesPanel";
import { RecipeStatusPanel } from "../RecipeStatusPanel";
import type { SelectedRecipeImage } from "./RecipeImageFilePicker";
import { BasicInfoStep } from "./BasicInfoStep";
import { IngredientsStep } from "./IngredientsStep";
import { ReviewStep } from "./ReviewStep";
import { firstStepWithErrors, type ServerErrors } from "./server-errors";
import { StepIndicator } from "./StepIndicator";
import { StepsStep } from "./StepsStep";

type RecipeFormWizardProps =
  | { mode: "create"; recipeId?: undefined; initialNotice?: undefined }
  | { mode: "edit"; recipeId: string; initialNotice?: string };

/** Lỗi backend → lỗi theo field (422 validation); null nếu không gắn được vào field nào. */
function toServerErrors(error: unknown): ServerErrors | null {
  if (!(error instanceof ApiError)) return null;
  if (error.problem.errors) return error.problem.errors;
  return null;
}

/**
 * Form tạo/sửa công thức nhiều bước. Dữ liệu nằm trong recipe-form-store; lưu qua API:
 * tạo → POST /recipes (kèm nguyên liệu/các bước); sửa → PUT /recipes/{id} (If-Match) rồi đồng bộ
 * nguyên liệu/các bước (saveRecipeEdit).
 */
export function RecipeFormWizard({ mode, recipeId, initialNotice }: RecipeFormWizardProps) {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [serverErrors, setServerErrors] = useState<ServerErrors | null>(null);
  // Thông báo validation/API gắn với form; thao tác hoàn tất một phần dùng Sonner.
  const [notice, setNotice] = useState<{ tone: "error" | "info"; text: string } | null>(null);
  const [coverImage, setCoverImage] = useState<SelectedRecipeImage | null>(null);
  const coverImageRef = useRef<SelectedRecipeImage | null>(null);
  const [stepImages, setStepImages] = useState<Record<string, SelectedRecipeImage>>({});
  const stepImagesRef = useRef<Record<string, SelectedRecipeImage>>({});
  const imageObjectUrls = useRef(new Set<string>());
  // Tăng khi nạp lại dữ liệu (xóa nháp, tải bản mới) để form của bước hiện tại mount lại.
  const [formVersion, setFormVersion] = useState(0);
  // Bản gốc + ETag tại thời điểm nạp vào form: dùng khi lưu để If-Match và phép đồng bộ khớp đúng
  // dữ liệu người dùng đang sửa (không dùng bản tải lại ở nền, tránh đè thay đổi của người khác).
  const base = useRef<RecipeWithEtag | null>(null);

  useEffect(() => () => {
    for (const url of imageObjectUrls.current) URL.revokeObjectURL(url);
    imageObjectUrls.current.clear();
  }, []);

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

  function revokeSelection(selection: SelectedRecipeImage | null | undefined) {
    if (!selection) return;
    URL.revokeObjectURL(selection.previewUrl);
    imageObjectUrls.current.delete(selection.previewUrl);
  }

  function selectCoverImage(file: File | null) {
    revokeSelection(coverImageRef.current);
    const selection = file
      ? { file, previewUrl: URL.createObjectURL(file) }
      : null;
    if (selection) imageObjectUrls.current.add(selection.previewUrl);
    coverImageRef.current = selection;
    setCoverImage(selection);
  }

  function selectStepImage(key: string, file: File | null) {
    const current = stepImagesRef.current;
    revokeSelection(current[key]);
    const next = { ...current };
    if (file) {
      const selection = { file, previewUrl: URL.createObjectURL(file) };
      imageObjectUrls.current.add(selection.previewUrl);
      next[key] = selection;
    } else {
      delete next[key];
    }
    stepImagesRef.current = next;
    setStepImages(next);
  }

  function clearCoverImage() {
    revokeSelection(coverImageRef.current);
    coverImageRef.current = null;
    setCoverImage(null);
  }

  function clearStepImage(key: string) {
    const current = stepImagesRef.current;
    revokeSelection(current[key]);
    const next = { ...current };
    delete next[key];
    stepImagesRef.current = next;
    setStepImages(next);
  }

  /** Demo: điền sẵn một món mẫu (kèm ảnh bìa + ảnh bước) để bấm "Tiếp tục" qua các bước. */
  const sampleIndex = useRef(0);
  async function fillSample() {
    const sample = SAMPLE_RECIPES[sampleIndex.current % SAMPLE_RECIPES.length];
    sampleIndex.current += 1;
    const category =
      categories.find((c) => sample.categoryHints.some((hint) => c.name.toLocaleLowerCase("vi").includes(hint))) ??
      categories[0];
    const uid = () => crypto.randomUUID();
    const steps = sample.steps.map((s) => ({ key: uid(), title: s.title ?? "", description: s.description, timerMinutes: s.timerMinutes }));
    const toFile = async (name: string) => {
      const blob = await (await fetch(`/demo/${name}`)).blob();
      return new File([blob], name, { type: "image/jpeg" });
    };
    try {
      const cover = await toFile(sample.cover);
      const stepFiles = await Promise.all(
        Object.entries(sample.stepImages).map(async ([index, name]) => [Number(index), await toFile(name)] as const),
      );
      for (const key of Object.keys(stepImagesRef.current)) clearStepImage(key);
      selectCoverImage(cover);
      for (const [index, file] of stepFiles) if (steps[index]) selectStepImage(steps[index].key, file);
    } catch {
      toast.error("Không tải được ảnh mẫu; vẫn điền phần chữ.");
    }
    useRecipeFormStore.setState({
      draft: {
        basic: {
          title: sample.title,
          description: sample.description,
          categoryId: category?.id ?? "",
          prepTimeMinutes: sample.prepTimeMinutes,
          cookTimeMinutes: sample.cookTimeMinutes,
          servings: sample.servings,
          difficulty: sample.difficulty,
          instructions: sample.instructions,
        },
        ingredients: sample.ingredients.map((i) => ({ key: uid(), name: i.name, quantity: i.quantity, unit: i.unit, notes: i.notes ?? "" })),
        steps,
        nutrition: { ...sample.nutrition },
      },
      currentStep: 0,
      completedSteps: [],
    });
    setServerErrors(null);
    setFormVersion((version) => version + 1);
    setNotice({ tone: "info", text: `Đã điền món mẫu "${sample.title}". Bấm "Tiếp tục" qua từng bước rồi lưu.` });
  }

  async function handleSubmit(publish = false) {
    setServerErrors(null);
    setNotice(null);
    const { draft } = useRecipeFormStore.getState();

    if (mode === "create") {
      let created: RecipeDetailDto;
      try {
        created = await createRecipe.mutateAsync(toCreateRecipeRequest(draft));
      } catch (error) {
        showServerErrors(error);
        return;
      }

      try {
        if (coverImage) {
          await uploadRecipeImage(created.id, coverImage.file, token);
          clearCoverImage();
        }
        await uploadStepImages(
          created.id,
          created.steps,
          draft.steps,
          stepImagesRef.current,
          token,
          clearStepImage,
        );
      } catch (error) {
        toast.error(`Công thức đã được tạo nhưng tải ảnh thất bại: ${getRecipeErrorMessage(error)}`);
        useRecipeFormStore.getState().reset();
        router.push(`/dashboard/recipes/${created.id}/edit?notice=images-pending`);
        return;
      }

      if (publish) {
        try {
          await changeRecipeStatus(created.id, "publish", token);
          toast.success("Đã xuất bản công thức.");
        } catch (error) {
          toast.error(`Công thức đã được lưu nháp nhưng xuất bản thất bại: ${getRecipeErrorMessage(error)}`);
          useRecipeFormStore.getState().reset();
          router.push(`/dashboard/recipes/${created.id}/edit`);
          return;
        }
      }

      try {
        await refreshPublicRecipes();
      } catch (error) {
        toast.error(`Công thức đã được tạo nhưng chưa làm mới được cache công khai: ${getRecipeErrorMessage(error)}`);
      }
      useRecipeFormStore.getState().reset();
      router.push(`/dashboard/recipes?notice=created&title=${encodeURIComponent(created.title)}`);
      return;
    }

    if (!base.current) return;
    try {
      const saved = await saveEdit.mutateAsync({ original: base.current.recipe, draft, etag: base.current.etag });
      base.current = saved;
      await uploadStepImages(
        saved.recipe.id,
        saved.recipe.steps,
        draft.steps,
        stepImagesRef.current,
        token,
        clearStepImage,
      );
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
    <div className="w-full space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <BackLink />
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">
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
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" disabled={!isReady || categories.length === 0} onClick={() => void fillSample()}>
              <Wand2 />
              Điền dữ liệu mẫu
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmDiscard(true)}>
              <RotateCcw />
              Làm lại từ đầu
            </Button>
          </div>
        )}
      </div>

      {(notice || initialNotice) && (
        <p
          role={notice?.tone === "error" ? "alert" : "status"}
          className={
            notice?.tone === "error"
              ? "rounded-xl border border-destructive/10 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              : "rounded-xl border border-primary-soft bg-primary-soft px-4 py-3 text-sm text-primary"
          }
        >
          {notice?.text ?? initialNotice}
        </p>
      )}

      {mode === "edit" && recipe && (
        <>
          <RecipeStatusPanel recipe={recipe} onStatusChanged={handleStatusChanged} />
          <RecipeImagesPanel
            recipeId={recipe.id}
            title={recipe.title}
            // Ảnh minh họa bước nằm ở từng bước (bước 3), không lặp lại trong thư viện ảnh công thức.
            images={recipe.images.filter((image) => !recipe.steps.some((step) => step.imageUrl === image.url))}
          />
        </>
      )}

      <StepIndicator currentStep={currentStep} completedSteps={completedSteps} onSelect={goToStep} />

      <div className="rounded-2xl border border-border bg-card p-5 sm:p-7">
        {!isReady ? (
          <div className="space-y-4" aria-busy="true">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-9 w-2/3" />
          </div>
        ) : (
          // key: mount lại form của bước để defaultValues lấy đúng dữ liệu mới nhất trong store.
          <div key={`${currentStep}-${formVersion}`}>
            {currentStep === 0 && <BasicInfoStep categories={categories} serverErrors={serverErrors} {...(mode === "create" ? { selectedImage: coverImage, onImageSelected: selectCoverImage } : {})} />}
            {currentStep === 1 && <IngredientsStep serverErrors={serverErrors} />}
            {currentStep === 2 && <StepsStep serverErrors={serverErrors} selectedImages={stepImages} onImageSelected={selectStepImage} />}
            {currentStep === 3 && (
              <ReviewStep
                categories={categories}
                isSubmitting={isSubmitting}
                onSubmit={(publish) => void handleSubmit(publish)}
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
          clearCoverImage();
          for (const key of Object.keys(stepImagesRef.current)) clearStepImage(key);
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
  files: Record<string, SelectedRecipeImage>,
  token: string | null | undefined,
  onUploaded: (key: string) => void,
) {
  const orderedCreatedSteps = [...createdSteps].sort((left, right) => left.stepNumber - right.stepNumber);
  for (const [index, draftStep] of draftSteps.entries()) {
    const selection = files[draftStep.key];
    const createdStep = orderedCreatedSteps[index];
    if (!selection) continue;
    if (!createdStep) {
      throw new Error(`Không tìm thấy bước ${index + 1} để gắn ảnh. Hãy tải lại công thức rồi thử lại.`);
    }

    const uploaded = await uploadRecipeImage(recipeId, selection.file, token);
    await updateStep(recipeId, createdStep.id, {
      title: createdStep.title,
      description: createdStep.description,
      timerMinutes: createdStep.timerMinutes,
      imageUrl: uploaded.url,
    }, token);
    onUploaded(draftStep.key);
  }
}

function BackLink() {
  const { data: session } = useSession();
  const label = session?.user.roles?.includes(Roles.Admin) ? "Quản lý công thức" : "Công thức của tôi";
  return (
    <Link
      href="/dashboard/recipes"
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="size-4" aria-hidden />
      {label}
    </Link>
  );
}
