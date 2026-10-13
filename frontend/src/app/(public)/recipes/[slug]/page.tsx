import type { Metadata } from "next";
import { notFound } from "next/navigation";
import RecipeJsonLd from "@/components/seo/RecipeJsonLd";
import RecipeImageManager from "@/components/recipes/RecipeImageManager";
import { getRecipeBySlug } from "@/lib/api/recipes";
import { SITE_URL } from "@/lib/config/env";
import { RecipeStatus, type RecipeDetailDto } from "@/lib/types/recipe";

interface RecipePageProps {
  params: Promise<{ slug: string }>;
}

function limitText(value: string, maxLength: number): string {
  return value.length > maxLength
    ? `${value.slice(0, maxLength - 1).trimEnd()}…`
    : value;
}

function getPrimaryImage(recipe: RecipeDetailDto): string | undefined {
  return recipe.images.find((image) => image.isPrimary)?.url ?? recipe.images[0]?.url;
}

export async function generateMetadata({
  params,
}: RecipePageProps): Promise<Metadata> {
  const { slug } = await params;
  const recipe = await getRecipeBySlug(slug);

  if (!recipe) {
    return {
      title: "Recipe not found | Culinary Blog",
      robots: { index: false, follow: false },
    };
  }

  const title = limitText(`${recipe.title} | Culinary Blog`, 60);
  const description = limitText(recipe.description, 160);
  const canonicalPath = `/recipes/${recipe.slug}`;
  const canonicalUrl = new URL(canonicalPath, SITE_URL).toString();
  const primaryImageUrl = getPrimaryImage(recipe);
  const isPublished = recipe.status === RecipeStatus.Published;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "article",
      ...(primaryImageUrl
        ? {
            images: [
              {
                url: primaryImageUrl,
                width: 1200,
                height: 630,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(primaryImageUrl ? { images: [primaryImageUrl] } : {}),
    },
    robots: isPublished ? "index, follow" : "noindex",
  };
}

export default async function RecipePage({ params }: RecipePageProps) {
  const { slug } = await params;
  const recipe = await getRecipeBySlug(slug);

  if (!recipe) {
    notFound();
  }

  return (
    <main>
      <RecipeJsonLd data={recipe} />
      <article>
        <h1>{recipe.title}</h1>
        <p>{recipe.description}</p>
      </article>
      <RecipeImageManager recipeId={recipe.id} images={recipe.images} />
    </main>
  );
}
