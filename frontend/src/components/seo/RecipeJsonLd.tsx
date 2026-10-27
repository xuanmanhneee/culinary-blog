import type { RecipeDetailDto } from "@/lib/types/recipe";
import { SITE_URL } from "@/lib/config/env";

interface RecipeJsonLdProps {
  data: RecipeDetailDto;
}

function toDuration(minutes: number): string {
  return `PT${Math.max(0, minutes)}M`;
}

function getImageUrl(image: RecipeDetailDto["images"][number]): string {
  return image.url;
}

/** schema.org NutritionInformation dùng chuỗi có đơn vị, ví dụ "18.5 g". */
function withUnit(value: number | null, unit: string): string | undefined {
  return value === null ? undefined : `${value} ${unit}`;
}

function getNutrition(nutrition: RecipeDetailDto["nutrition"]) {
  const values = {
    calories: withUnit(nutrition.calories, "calories"),
    proteinContent: withUnit(nutrition.protein, "g"),
    carbohydrateContent: withUnit(nutrition.carbohydrates, "g"),
    fatContent: withUnit(nutrition.fat, "g"),
    fiberContent: withUnit(nutrition.fiber, "g"),
    sodiumContent: withUnit(nutrition.sodium, "mg"),
  };

  // Backend luôn trả object nutrition; chỉ xuất JSON-LD khi có ít nhất một giá trị.
  return Object.values(values).some(Boolean)
    ? { "@type": "NutritionInformation", ...values }
    : undefined;
}

function formatIngredient(
  ingredient: RecipeDetailDto["ingredients"][number],
): string {
  const quantity = ingredient.quantity === null || ingredient.quantity === undefined
    ? ""
    : `${ingredient.quantity} `;
  const unit = ingredient.unit ? `${ingredient.unit} ` : "";

  return `${quantity}${unit}${ingredient.name}`.trim();
}

export default function RecipeJsonLd({ data }: RecipeJsonLdProps) {
  const images = data.images.map(getImageUrl).filter(Boolean);
  const ingredients = [...data.ingredients]
    .sort((left, right) => left.orderIndex - right.orderIndex)
    .map(formatIngredient);
  const instructions = [...data.steps]
    .sort((left, right) => left.stepNumber - right.stepNumber)
    .map((step) => ({
      "@type": "HowToStep",
      name: step.title,
      text: step.description,
      ...(step.imageUrl ? { image: step.imageUrl } : {}),
    }));
  const recipeJsonLd = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    "@id": `${SITE_URL}/recipes/${encodeURIComponent(data.slug)}#recipe`,
    url: `${SITE_URL}/recipes/${encodeURIComponent(data.slug)}`,
    name: data.title,
    description: data.description,
    ...(images.length > 0 ? { image: images } : {}),
    ...(data.author
      ? { author: { "@type": "Person", name: data.author.displayName } }
      : {}),
    datePublished: data.publishedAt ?? undefined,
    prepTime: toDuration(data.prepTimeMinutes),
    cookTime: toDuration(data.cookTimeMinutes),
    totalTime: toDuration(data.prepTimeMinutes + data.cookTimeMinutes),
    recipeYield: `${data.servings} phần`,
    recipeCategory: data.category?.name,
    recipeIngredient: ingredients,
    recipeInstructions: instructions,
    nutrition: getNutrition(data.nutrition),
  };

  const serializedData = JSON.stringify(recipeJsonLd)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializedData }}
    />
  );
}
