import type { RecipeDetailDto } from "@/lib/types/recipe";

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
  const recipeJsonLd = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: data.title,
    description: data.description,
    image: data.images.map(getImageUrl).filter(Boolean),
    ...(data.author
      ? { author: { "@type": "Person", name: data.author.displayName } }
      : {}),
    datePublished: data.publishedAt ?? undefined,
    prepTime: toDuration(data.prepTimeMinutes),
    cookTime: toDuration(data.cookTimeMinutes),
    totalTime: toDuration(data.prepTimeMinutes + data.cookTimeMinutes),
    recipeYield: `${data.servings} phần`,
    recipeCategory: data.category?.name,
    recipeIngredient: data.ingredients.map(formatIngredient),
    recipeInstructions: data.steps.map((step) => ({
      "@type": "HowToStep",
      name: step.title,
      text: step.description,
    })),
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
