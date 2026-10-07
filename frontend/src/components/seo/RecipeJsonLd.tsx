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
      ? {
          author: {
            "@type": "Person",
            name: data.author.displayName,
          },
        }
      : {}),
    ...(data.publishedAt ? { datePublished: data.publishedAt } : {}),
    prepTime: toDuration(data.prepTimeMinutes),
    cookTime: toDuration(data.cookTimeMinutes),
    totalTime: toDuration(data.prepTimeMinutes + data.cookTimeMinutes),
    recipeYield: `${data.servings} phần`,
    ...(data.category ? { recipeCategory: data.category.name } : {}),
    recipeIngredient: data.ingredients.map(formatIngredient),
    recipeInstructions: data.steps.map((step) => ({
      "@type": "HowToStep",
      name: step.title,
      text: step.description,
    })),
    ...(data.nutrition
      ? {
          nutrition: {
            "@type": "NutritionInformation",
            ...(data.nutrition.calories === null ? {} : { calories: `${data.nutrition.calories} calories` }),
            ...(data.nutrition.protein === null ? {} : { proteinContent: `${data.nutrition.protein} g` }),
            ...(data.nutrition.carbohydrates === null ? {} : { carbohydrateContent: `${data.nutrition.carbohydrates} g` }),
            ...(data.nutrition.fat === null ? {} : { fatContent: `${data.nutrition.fat} g` }),
            ...(data.nutrition.fiber === null ? {} : { fiberContent: `${data.nutrition.fiber} g` }),
            ...(data.nutrition.sodium === null ? {} : { sodiumContent: `${data.nutrition.sodium} mg` }),
          },
        }
      : {}),
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
