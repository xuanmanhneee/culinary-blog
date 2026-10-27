"use client";

/**
 * Store (Zustand) của form tạo/sửa công thức nhiều bước (FR-RCP-003/004/009/010).
 *
 * - Giữ dữ liệu khi chuyển qua lại giữa các bước (mỗi bước là một form React Hook Form riêng).
 * - Chế độ tạo mới được lưu tạm vào sessionStorage: tải lại trang không mất bản nháp,
 *   mỗi tab trình duyệt có bản nháp riêng, đóng tab thì xóa.
 * - Chế độ sửa nạp từ RecipeDetailDto và không lưu tạm (dữ liệu gốc nằm trên server).
 */
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  RecipeDifficulty,
  type CreateRecipeRequest,
  type NutritionRequest,
  type RecipeDetailDto,
  type UpdateRecipeRequest,
} from "@/lib/types/recipe";

// ---------------------------------------------------------------- Bước của form

export const RECIPE_FORM_STEPS = [
  { id: "basic", label: "Thông tin cơ bản" },
  { id: "ingredients", label: "Nguyên liệu" },
  { id: "steps", label: "Các bước thực hiện" },
  { id: "review", label: "Dinh dưỡng & xem lại" },
] as const;

export type RecipeFormStepId = (typeof RECIPE_FORM_STEPS)[number]["id"];

// ---------------------------------------------------------------- Dữ liệu nháp

export interface RecipeBasicDraft {
  title: string;
  description: string;
  categoryId: string;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  difficulty: RecipeDifficulty;
  instructions: string;
}

/** `key` chỉ dùng phía client (React key, sắp xếp); `id` là id trên server khi đang sửa. */
export interface IngredientDraft {
  key: string;
  id?: string;
  name: string;
  quantity: number | null;
  unit: string;
  notes: string;
}

export interface StepDraft {
  key: string;
  id?: string;
  title: string;
  description: string;
  timerMinutes: number | null;
}

export type NutritionDraft = Required<{ [K in keyof NutritionRequest]: number | null }>;

export interface RecipeFormDraft {
  basic: RecipeBasicDraft;
  ingredients: IngredientDraft[];
  steps: StepDraft[];
  nutrition: NutritionDraft;
}

const emptyBasic: RecipeBasicDraft = {
  title: "",
  description: "",
  categoryId: "",
  prepTimeMinutes: 15,
  cookTimeMinutes: 30,
  servings: 2,
  difficulty: RecipeDifficulty.Easy,
  instructions: "",
};

const emptyNutrition: NutritionDraft = {
  calories: null,
  protein: null,
  carbohydrates: null,
  fat: null,
  fiber: null,
  sodium: null,
};

function newKey(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function emptyIngredient(): IngredientDraft {
  return { key: newKey(), name: "", quantity: null, unit: "", notes: "" };
}

export function emptyStep(): StepDraft {
  return { key: newKey(), title: "", description: "", timerMinutes: null };
}

function emptyDraft(): RecipeFormDraft {
  return { basic: { ...emptyBasic }, ingredients: [], steps: [], nutrition: { ...emptyNutrition } };
}

function move<T>(items: T[], from: number, to: number): T[] {
  if (to < 0 || to >= items.length || from === to) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

// ---------------------------------------------------------------- Store

interface CreateSnapshot {
  draft: RecipeFormDraft;
  currentStep: number;
  completedSteps: number[];
}

interface RecipeFormState {
  /** "create": /dashboard/recipes/new; "edit": /dashboard/recipes/[id]/edit. */
  mode: "create" | "edit";
  recipeId: string | null;
  /** RowVersion của recipe đang sửa, gửi qua If-Match (FR-RCP-004). */
  rowVersion: string | null;
  draft: RecipeFormDraft;
  currentStep: number;
  /** Các bước đã điền hợp lệ, cho phép bấm quay lại trên thanh tiến trình. */
  completedSteps: number[];
  /** Bản nháp tạo mới được cất lại khi mở trang sửa, để quay về /new không bị mất. */
  createStash: CreateSnapshot | null;

  setBasic: (basic: RecipeBasicDraft) => void;
  setIngredients: (ingredients: IngredientDraft[]) => void;
  addIngredient: () => void;
  updateIngredient: (key: string, changes: Partial<Omit<IngredientDraft, "key">>) => void;
  removeIngredient: (key: string) => void;
  moveIngredient: (from: number, to: number) => void;
  setSteps: (steps: StepDraft[]) => void;
  addStep: () => void;
  updateStep: (key: string, changes: Partial<Omit<StepDraft, "key">>) => void;
  removeStep: (key: string) => void;
  moveStep: (from: number, to: number) => void;
  setNutrition: (nutrition: NutritionDraft) => void;

  goToStep: (step: number) => void;
  completeStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;

  /** Bắt đầu form tạo mới; giữ bản nháp đang có trừ khi `discard = true`. */
  startCreate: (discard?: boolean) => void;
  /** Nạp recipe từ GET /api/v1/recipes/{id} để sửa. */
  loadFromRecipe: (recipe: RecipeDetailDto) => void;
  reset: () => void;
}

const lastStep = RECIPE_FORM_STEPS.length - 1;

export const useRecipeFormStore = create<RecipeFormState>()(
  persist(
    (set, get) => ({
      mode: "create",
      recipeId: null,
      rowVersion: null,
      draft: emptyDraft(),
      currentStep: 0,
      completedSteps: [],
      createStash: null,

      setBasic: (basic) => set((state) => ({ draft: { ...state.draft, basic } })),

      setIngredients: (ingredients) => set((state) => ({ draft: { ...state.draft, ingredients } })),
      addIngredient: () =>
        set((state) => ({ draft: { ...state.draft, ingredients: [...state.draft.ingredients, emptyIngredient()] } })),
      updateIngredient: (key, changes) =>
        set((state) => ({
          draft: {
            ...state.draft,
            ingredients: state.draft.ingredients.map((item) => (item.key === key ? { ...item, ...changes } : item)),
          },
        })),
      removeIngredient: (key) =>
        set((state) => ({
          draft: { ...state.draft, ingredients: state.draft.ingredients.filter((item) => item.key !== key) },
        })),
      moveIngredient: (from, to) =>
        set((state) => ({ draft: { ...state.draft, ingredients: move(state.draft.ingredients, from, to) } })),

      setSteps: (steps) => set((state) => ({ draft: { ...state.draft, steps } })),
      addStep: () => set((state) => ({ draft: { ...state.draft, steps: [...state.draft.steps, emptyStep()] } })),
      updateStep: (key, changes) =>
        set((state) => ({
          draft: {
            ...state.draft,
            steps: state.draft.steps.map((item) => (item.key === key ? { ...item, ...changes } : item)),
          },
        })),
      removeStep: (key) =>
        set((state) => ({ draft: { ...state.draft, steps: state.draft.steps.filter((item) => item.key !== key) } })),
      moveStep: (from, to) => set((state) => ({ draft: { ...state.draft, steps: move(state.draft.steps, from, to) } })),

      setNutrition: (nutrition) => set((state) => ({ draft: { ...state.draft, nutrition } })),

      goToStep: (step) => {
        const { completedSteps, currentStep } = get();
        // Chỉ nhảy tới bước đã hoàn thành hoặc bước ngay sau bước hiện tại.
        if (step <= currentStep || completedSteps.includes(step - 1)) {
          set({ currentStep: Math.min(Math.max(step, 0), lastStep) });
        }
      },
      completeStep: (step) =>
        set((state) => ({
          completedSteps: state.completedSteps.includes(step) ? state.completedSteps : [...state.completedSteps, step],
        })),
      nextStep: () =>
        set((state) => ({
          completedSteps: state.completedSteps.includes(state.currentStep)
            ? state.completedSteps
            : [...state.completedSteps, state.currentStep],
          currentStep: Math.min(state.currentStep + 1, lastStep),
        })),
      previousStep: () => set((state) => ({ currentStep: Math.max(state.currentStep - 1, 0) })),

      startCreate: (discard = false) => {
        const state = get();
        if (!discard && state.mode === "create") return;

        // Từ trang sửa quay về /new: khôi phục bản nháp tạo mới đã cất (nếu có).
        const restored = !discard && state.createStash ? state.createStash : null;
        set({
          mode: "create",
          recipeId: null,
          rowVersion: null,
          draft: restored?.draft ?? emptyDraft(),
          currentStep: restored?.currentStep ?? 0,
          completedSteps: restored?.completedSteps ?? [],
          createStash: null,
        });
      },
      loadFromRecipe: (recipe) => {
        const state = get();
        set({
          mode: "edit",
          recipeId: recipe.id,
          rowVersion: recipe.rowVersion,
          draft: draftFromRecipe(recipe),
          currentStep: 0,
          // Recipe đã có trên server: mọi bước coi như đã điền, cho phép nhảy thẳng tới bước bất kỳ.
          completedSteps: RECIPE_FORM_STEPS.map((_, index) => index),
          createStash:
            state.mode === "create"
              ? { draft: state.draft, currentStep: state.currentStep, completedSteps: state.completedSteps }
              : state.createStash,
        });
      },
      reset: () =>
        set({
          mode: "create",
          recipeId: null,
          rowVersion: null,
          draft: emptyDraft(),
          currentStep: 0,
          completedSteps: [],
          createStash: null,
        }),
    }),
    {
      name: "culinary-blog:recipe-form-draft",
      version: 1,
      storage: createJSONStorage(() => sessionStorage),
      // Chỉ lưu bản nháp tạo mới (đang mở hoặc đang cất); dữ liệu đang sửa luôn nạp lại từ server.
      partialize: (state): Partial<RecipeFormState> => {
        const create =
          state.mode === "create"
            ? { draft: state.draft, currentStep: state.currentStep, completedSteps: state.completedSteps }
            : state.createStash;
        return create ? { mode: "create", ...create } : {};
      },
      // Next.js render trên server trước: tự gọi rehydrate() trong useEffect để tránh lệch HTML.
      skipHydration: true,
    },
  ),
);

// ---------------------------------------------------------------- Chuyển đổi dữ liệu

export function draftFromRecipe(recipe: RecipeDetailDto): RecipeFormDraft {
  return {
    basic: {
      title: recipe.title,
      description: recipe.description,
      categoryId: recipe.category?.id ?? "",
      prepTimeMinutes: recipe.prepTimeMinutes,
      cookTimeMinutes: recipe.cookTimeMinutes,
      servings: recipe.servings,
      difficulty: recipe.difficulty,
      instructions: recipe.instructions,
    },
    ingredients: [...recipe.ingredients]
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((item) => ({
        key: newKey(),
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit ?? "",
        notes: item.notes ?? "",
      })),
    steps: [...recipe.steps]
      .sort((a, b) => a.stepNumber - b.stepNumber)
      .map((item) => ({
        key: newKey(),
        id: item.id,
        title: item.title,
        description: item.description,
        timerMinutes: item.timerMinutes,
      })),
    nutrition: { ...recipe.nutrition },
  };
}

function blankToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function nutritionOrNull(nutrition: NutritionDraft): NutritionRequest | null {
  return Object.values(nutrition).some((value) => value !== null) ? { ...nutrition } : null;
}

/** Bản nháp → body POST /api/v1/recipes (FR-RCP-003). Bước không có title để backend đặt "Bước n". */
export function toCreateRecipeRequest(draft: RecipeFormDraft): CreateRecipeRequest {
  const { basic } = draft;
  return {
    title: basic.title.trim(),
    description: basic.description.trim(),
    categoryId: basic.categoryId,
    prepTimeMinutes: basic.prepTimeMinutes,
    cookTimeMinutes: basic.cookTimeMinutes,
    servings: basic.servings,
    difficulty: basic.difficulty,
    instructions: blankToNull(basic.instructions),
    nutrition: nutritionOrNull(draft.nutrition),
    ingredients: draft.ingredients.map((item, index) => ({
      name: item.name.trim(),
      quantity: item.quantity,
      unit: blankToNull(item.unit),
      notes: blankToNull(item.notes),
      orderIndex: index,
    })),
    steps: draft.steps.map((item) => ({
      description: item.description.trim(),
      title: blankToNull(item.title),
      timerMinutes: item.timerMinutes,
    })),
  };
}

/**
 * Bản nháp → body PUT /api/v1/recipes/{id} (FR-RCP-004). Nguyên liệu và các bước được cập nhật
 * riêng qua FR-RCP-009/010 nên không nằm trong body này.
 */
export function toUpdateRecipeRequest(draft: RecipeFormDraft): UpdateRecipeRequest {
  const { basic } = draft;
  return {
    title: basic.title.trim(),
    description: basic.description.trim(),
    categoryId: basic.categoryId,
    prepTimeMinutes: basic.prepTimeMinutes,
    cookTimeMinutes: basic.cookTimeMinutes,
    servings: basic.servings,
    difficulty: basic.difficulty,
    instructions: blankToNull(basic.instructions),
    nutrition: nutritionOrNull(draft.nutrition),
  };
}
