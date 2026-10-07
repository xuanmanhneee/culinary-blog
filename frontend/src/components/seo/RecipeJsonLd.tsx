import type { RecipeDetailDto } from "@/lib/types/recipe";

interface RecipeJsonLdProps {
  data: RecipeDetailDto;
}

function toDuration(minutes: number): string {
  return `PT${Math.max(0, minutes)}M`;
}

function getImageUrl(image: RecipeDetailDto["images"][number]): string {
  return image.url || image.originalUrl || "";
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
    author: {
      "@type": "Person",
      name: data.author.displayName,
    },
    datePublished: data.publishedAt,
    prepTime: toDuration(data.prepTimeMinutes),
    cookTime: toDuration(data.cookTimeMinutes),
    totalTime: toDuration(data.prepTimeMinutes + data.cookTimeMinutes),
    recipeYield: `${data.servings} phần`,
    recipeCategory: data.category.name,
    recipeIngredient: data.ingredients.map(formatIngredient),
    recipeInstructions: data.steps.map((step) => ({
      "@type": "HowToStep",
      text: step.description,
    })),
    ...(data.nutrition
      ? {
          nutrition: {
            "@type": "NutritionInformation",
            calories: data.nutrition.calories,
            proteinContent: data.nutrition.proteinContent,
            carbohydrateContent: data.nutrition.carbohydrateContent,
            fatContent: data.nutrition.fatContent,
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
