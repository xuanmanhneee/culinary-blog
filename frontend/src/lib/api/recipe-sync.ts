/**
 * Lưu form sửa công thức lên server (FR-RCP-004/009/010). Backend tách thông tin chính
 * (PUT /recipes/{id} kèm If-Match) với nguyên liệu và các bước (endpoint con), nên hàm này
 * cập nhật thông tin chính trước – xung đột RowVersion dừng ngay, chưa đụng tới dữ liệu con –
 * rồi đồng bộ phần con theo khác biệt giữa bản gốc và bản nháp.
 */
import {
  addIngredient,
  addStep,
  deleteIngredient,
  deleteStep,
  getRecipeById,
  updateIngredient,
  updateRecipe,
  updateStep,
  type RecipeWithEtag,
} from "@/lib/api/recipe-management";
import { toUpdateRecipeRequest, type RecipeFormDraft } from "@/lib/stores/recipe-form-store";
import type { RecipeDetailDto } from "@/lib/types/recipe";

type Token = string | null | undefined;

function blankToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

/**
 * Nguyên liệu: so theo id. Có id → cập nhật nếu đổi (kể cả thứ tự), không id → thêm,
 * id gốc không còn trong bản nháp → xóa. Thứ tự lưu qua orderIndex = vị trí trong form.
 */
async function syncIngredients(original: RecipeDetailDto, draft: RecipeFormDraft, token: Token) {
  const recipeId = original.id;
  const originals = new Map(original.ingredients.map((item) => [item.id, item]));
  const keptIds = new Set(draft.ingredients.flatMap((item) => (item.id ? [item.id] : [])));

  for (const removed of original.ingredients.filter((item) => !keptIds.has(item.id))) {
    await deleteIngredient(recipeId, removed.id, token);
  }

  for (const [index, item] of draft.ingredients.entries()) {
    const body = {
      name: item.name.trim(),
      quantity: item.quantity,
      unit: blankToNull(item.unit),
      notes: blankToNull(item.notes),
      orderIndex: index,
    };
    const before = item.id ? originals.get(item.id) : undefined;
    if (!before) {
      await addIngredient(recipeId, body, token);
    } else if (
      before.name !== body.name ||
      before.quantity !== body.quantity ||
      before.unit !== body.unit ||
      before.notes !== body.notes ||
      before.orderIndex !== body.orderIndex
    ) {
      await updateIngredient(recipeId, before.id, body, token);
    }
  }
}

/**
 * Các bước: backend tự đánh StepNumber và không có API đổi thứ tự, nên đồng bộ theo VỊ TRÍ –
 * bước thứ i trên form ghi vào bước thứ i trên server; thừa thì thêm vào cuối, thiếu thì xóa
 * từ cuối lên (không làm xáo trộn số thứ tự các bước phía trước).
 */
async function syncSteps(original: RecipeDetailDto, draft: RecipeFormDraft, token: Token) {
  const recipeId = original.id;
  const existing = [...original.steps].sort((a, b) => a.stepNumber - b.stepNumber);
  const wanted = draft.steps;

  for (let index = existing.length - 1; index >= wanted.length; index -= 1) {
    await deleteStep(recipeId, existing[index].id, token);
  }

  for (const [index, item] of wanted.entries()) {
    const body = {
      description: item.description.trim(),
      title: blankToNull(item.title),
      timerMinutes: item.timerMinutes,
    };
    const target = existing[index];
    if (!target) {
      await addStep(recipeId, body, token);
      continue;
    }
    // Title trống → backend giữ title hiện tại; mặc định "Bước n" theo vị trí mới.
    const title = body.title ?? `Bước ${index + 1}`;
    if (target.description !== body.description || target.title !== title || target.timerMinutes !== body.timerMinutes) {
      await updateStep(recipeId, target.id, { ...body, title }, token);
    }
  }
}

/**
 * Lưu toàn bộ form sửa. Trả về bản mới nhất từ server (kèm ETag) để nạp lại form/cache.
 * Lỗi (ApiError) được ném ra cho nơi gọi hiển thị; nếu lỗi xảy ra sau bước PUT, thông tin chính
 * đã được lưu – nơi gọi nên tải lại dữ liệu.
 */
export async function saveRecipeEdit(
  original: RecipeDetailDto,
  draft: RecipeFormDraft,
  etag: string,
  token: Token,
): Promise<RecipeWithEtag> {
  await updateRecipe(original.id, toUpdateRecipeRequest(draft), etag, token);
  await syncIngredients(original, draft, token);
  await syncSteps(original, draft, token);
  return getRecipeById(original.id, token);
}
