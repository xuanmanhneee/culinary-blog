/**
 * Dữ liệu mẫu cho giao diện tĩnh của dashboard công thức (Lab 6). Cùng kiểu với response
 * GET /api/v1/recipes nên khi nối API chỉ cần thay nguồn dữ liệu.
 */
import {
  RecipeDifficulty,
  RecipeStatus,
  type RecipeCategoryDto,
  type RecipeDetailDto,
  type RecipeListItemDto,
} from "@/lib/types/recipe";

export const mockCategories: RecipeCategoryDto[] = [
  { id: "c1000000-0000-0000-0000-000000000001", name: "Món chính", slug: "mon-chinh" },
  { id: "c1000000-0000-0000-0000-000000000002", name: "Món canh", slug: "mon-canh" },
  { id: "c1000000-0000-0000-0000-000000000003", name: "Tráng miệng", slug: "trang-mieng" },
  { id: "c1000000-0000-0000-0000-000000000004", name: "Đồ uống", slug: "do-uong" },
];

const author = { id: "author-demo", displayName: "Nguyễn Văn A", avatarUrl: null };

function recipe(
  index: number,
  title: string,
  slug: string,
  description: string,
  category: RecipeCategoryDto,
  status: RecipeStatus,
  difficulty: RecipeDifficulty,
  prepTimeMinutes: number,
  cookTimeMinutes: number,
  servings: number,
  withImage = true,
): RecipeListItemDto {
  const createdAt = new Date(Date.UTC(2026, 9, 20 - index, 8, 30)).toISOString();
  return {
    id: `r1000000-0000-0000-0000-${String(index).padStart(12, "0")}`,
    title,
    slug,
    description,
    prepTimeMinutes,
    cookTimeMinutes,
    servings,
    difficulty,
    status,
    createdAt,
    publishedAt: status === RecipeStatus.Published ? createdAt : null,
    primaryImageUrl: withImage ? `https://picsum.photos/seed/${slug}/640/480` : null,
    category,
    author,
  };
}

const [main, soup, dessert, drink] = mockCategories;

export const mockDashboardRecipes: RecipeListItemDto[] = [
  recipe(1, "Phở bò Hà Nội", "pho-bo-ha-noi", "Nước dùng hầm xương 8 tiếng, thơm quế hồi.", soup,
    RecipeStatus.Published, RecipeDifficulty.Hard, 30, 480, 6),
  recipe(2, "Canh chua cá lóc miền Tây", "canh-chua-ca-loc", "Vị chua thanh của me, ngọt của dứa và cá lóc đồng.", soup,
    RecipeStatus.Draft, RecipeDifficulty.Medium, 15, 25, 4),
  recipe(3, "Cơm tấm sườn nướng", "com-tam-suon-nuong", "Sườn ướp mật ong nướng than, ăn kèm bì chả.", main,
    RecipeStatus.Published, RecipeDifficulty.Medium, 40, 30, 4),
  recipe(4, "Chè khúc bạch", "che-khuc-bach", "Thạch sữa mềm, nhãn tươi và hạnh nhân rang.", dessert,
    RecipeStatus.Draft, RecipeDifficulty.Easy, 20, 10, 6, false),
  recipe(5, "Bò kho bánh mì", "bo-kho-banh-mi", "Bò kho sả ớt, nước sốt sánh, chấm bánh mì giòn.", main,
    RecipeStatus.Archived, RecipeDifficulty.Medium, 30, 120, 5),
  recipe(6, "Trà đào cam sả", "tra-dao-cam-sa", "Thức uống giải nhiệt với đào ngâm, cam tươi và sả.", drink,
    RecipeStatus.Published, RecipeDifficulty.Easy, 10, 5, 2),
  recipe(7, "Bánh flan caramel", "banh-flan-caramel", "Mềm mịn, caramel đắng nhẹ, hấp cách thủy.", dessert,
    RecipeStatus.Published, RecipeDifficulty.Medium, 20, 40, 8),
  recipe(8, "Gà kho gừng", "ga-kho-gung", "Thịt gà săn, đậm vị gừng, ăn với cơm trắng.", main,
    RecipeStatus.Draft, RecipeDifficulty.Easy, 15, 35, 4, false),
];

/**
 * Chi tiết mẫu cho trang sửa (cùng kiểu với GET /api/v1/recipes/{id}). Recipe "Canh chua" có đủ
 * nguyên liệu/bước; các recipe khác dùng nguyên liệu/bước chung để form luôn có dữ liệu.
 */
export function getMockRecipeDetail(id: string): RecipeDetailDto | null {
  const item = mockDashboardRecipes.find((recipe) => recipe.id === id);
  if (!item) return null;

  const isCanhChua = item.slug === "canh-chua-ca-loc";
  return {
    id: item.id,
    title: item.title,
    slug: item.slug,
    description: item.description,
    instructions: isCanhChua ? "Nêm nếm lại trước khi tắt bếp, ăn kèm bún hoặc cơm trắng." : "",
    prepTimeMinutes: item.prepTimeMinutes,
    cookTimeMinutes: item.cookTimeMinutes,
    servings: item.servings,
    difficulty: item.difficulty,
    status: item.status,
    publishedAt: item.publishedAt,
    category: item.category,
    author: item.author,
    images: item.primaryImageUrl
      ? [{ id: `${item.id}-img`, url: item.primaryImageUrl, altText: item.title, isPrimary: true, orderIndex: 0 }]
      : [],
    nutrition: isCanhChua
      ? { calories: 220, protein: 18.5, carbohydrates: 12, fat: 6, fiber: 2.4, sodium: 640 }
      : { calories: null, protein: null, carbohydrates: null, fat: null, fiber: null, sodium: null },
    ingredients: isCanhChua
      ? [
          { id: "ing-1", name: "Cá lóc", quantity: 500, unit: "g", notes: "cắt khúc", orderIndex: 0 },
          { id: "ing-2", name: "Me chua", quantity: 50, unit: "g", notes: "dầm lấy nước", orderIndex: 1 },
          { id: "ing-3", name: "Dứa", quantity: 0.25, unit: "quả", notes: null, orderIndex: 2 },
          { id: "ing-4", name: "Rau ngổ, ngò gai", quantity: null, unit: null, notes: "vừa đủ", orderIndex: 3 },
        ]
      : [{ id: "ing-1", name: "Nguyên liệu chính", quantity: 500, unit: "g", notes: null, orderIndex: 0 }],
    steps: isCanhChua
      ? [
          { id: "step-1", stepNumber: 1, title: "Sơ chế cá", description: "Rửa cá với muối, cắt khúc vừa ăn.", timerMinutes: 10, imageUrl: null },
          { id: "step-2", stepNumber: 2, title: "Nấu nước dùng", description: "Đun sôi nước với me, thêm dứa.", timerMinutes: 10, imageUrl: null },
          { id: "step-3", stepNumber: 3, title: "Bước 3", description: "Cho cá vào nấu chín, nêm nếm, thêm rau.", timerMinutes: 5, imageUrl: null },
        ]
      : [{ id: "step-1", stepNumber: 1, title: "Bước 1", description: "Chế biến theo công thức.", timerMinutes: null, imageUrl: null }],
    rowVersion: "AAAAAAAAB9E=",
  };
}
