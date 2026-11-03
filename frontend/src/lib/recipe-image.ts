export const RECIPE_IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/avif";
export const RECIPE_IMAGE_MAX_SIZE = 5 * 1024 * 1024;
export const RECIPE_IMAGE_TYPES = new Set(RECIPE_IMAGE_ACCEPT.split(","));

export function validateRecipeImageFile(file: File): string | null {
  if (!RECIPE_IMAGE_TYPES.has(file.type)) {
    return `"${file.name}": chỉ hỗ trợ ảnh JPEG, PNG, WebP hoặc AVIF.`;
  }
  if (file.size > RECIPE_IMAGE_MAX_SIZE) {
    return `"${file.name}": ảnh không được vượt quá 5 MB.`;
  }
  return null;
}
