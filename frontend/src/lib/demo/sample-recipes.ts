/**
 * Dữ liệu mẫu để demo nhanh: bấm "Điền dữ liệu mẫu" ở form tạo công thức rồi "Tiếp tục" qua các bước.
 * Ảnh nằm ở public/demo/. `stepImages` là chỉ số bước (từ 0) → tên file ảnh.
 */
import { RecipeDifficulty } from "@/lib/types/recipe";

export interface SampleRecipe {
  title: string;
  description: string;
  /** Từ khóa để tự chọn danh mục (so khớp tên danh mục, không phân biệt hoa thường); không khớp thì lấy danh mục đầu tiên. */
  categoryHints: string[];
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  difficulty: RecipeDifficulty;
  instructions: string;
  cover: string;
  stepImages: Record<number, string>;
  ingredients: { name: string; quantity: number | null; unit: string; notes?: string }[];
  steps: { title?: string; description: string; timerMinutes: number | null }[];
  nutrition: { calories: number; protein: number; carbohydrates: number; fat: number; fiber: number; sodium: number };
}

export const SAMPLE_RECIPES: SampleRecipe[] = [
  {
    title: "Phở bò Hà Nội",
    description: "Tô phở nước trong, ngọt thanh từ xương bò hầm kỹ cùng gừng nướng, hành nướng và quế hồi thơm nồng.",
    categoryHints: ["món chính", "món nước", "việt"],
    prepTimeMinutes: 30,
    cookTimeMinutes: 180,
    servings: 4,
    difficulty: RecipeDifficulty.Hard,
    instructions: "Xương nên chần qua nước sôi để nước dùng trong. Có thể hầm trước một ngày, hâm lại khi ăn sẽ đậm vị hơn.",
    cover: "pho-cover.jpg",
    stepImages: { 0: "pho-step-0.jpg", 1: "pho-step-1.jpg", 2: "pho-step-2.jpg", 3: "pho-step.jpg" },
    ingredients: [
      { name: "Xương ống bò", quantity: 1.5, unit: "kg" },
      { name: "Thịt bò thăn", quantity: 300, unit: "g", notes: "Thái mỏng" },
      { name: "Bánh phở", quantity: 500, unit: "g" },
      { name: "Gừng", quantity: 1, unit: "củ", notes: "Nướng thơm" },
      { name: "Hành tây", quantity: 2, unit: "củ", notes: "Nướng xém vỏ" },
      { name: "Quế, hồi, thảo quả", quantity: 1, unit: "bộ gia vị" },
      { name: "Hành lá, ngò gai, chanh, ớt", quantity: null, unit: "", notes: "Ăn kèm" },
    ],
    steps: [
      { title: "Chần xương", description: "Chần xương bò qua nước sôi 5 phút, rửa sạch bọt bẩn rồi cho vào nồi lớn.", timerMinutes: 5 },
      { title: "Nướng gia vị", description: "Nướng gừng, hành tây cho thơm xém; rang quế, hồi, thảo quả trên chảo khô đến khi dậy mùi.", timerMinutes: 10 },
      { title: "Hầm nước dùng", description: "Cho xương, gừng, hành và gia vị vào nồi, đổ ngập nước, hầm lửa nhỏ và hớt bọt thường xuyên. Nêm nước mắm, muối cho vừa miệng.", timerMinutes: 180 },
      { title: "Hoàn thiện", description: "Trụng bánh phở, xếp thịt bò thái mỏng lên trên, chan nước dùng thật nóng, thêm hành lá và rau thơm.", timerMinutes: null },
    ],
    nutrition: { calories: 450, protein: 32, carbohydrates: 55, fat: 10, fiber: 2, sodium: 1200 },
  },
  {
    title: "Gỏi cuốn tôm thịt",
    description: "Cuốn bánh tráng giòn mát với tôm, thịt luộc, bún và rau sống, chấm cùng tương đậu phộng béo bùi.",
    categoryHints: ["khai vị", "món nhẹ", "salad", "việt"],
    prepTimeMinutes: 30,
    cookTimeMinutes: 15,
    servings: 4,
    difficulty: RecipeDifficulty.Easy,
    instructions: "Nhúng bánh tráng nhanh tay vào nước ấm để bánh không bị rách khi cuốn.",
    cover: "goi-cuon-cover.jpg",
    stepImages: { 0: "goi-cuon-step-0.jpg", 1: "goi-cuon-step-1.jpg", 2: "goi-cuon-step.jpg", 3: "goi-cuon-step-3.jpg" },
    ingredients: [
      { name: "Tôm sú", quantity: 300, unit: "g" },
      { name: "Thịt ba chỉ", quantity: 200, unit: "g" },
      { name: "Bánh tráng", quantity: 16, unit: "tấm" },
      { name: "Bún tươi", quantity: 200, unit: "g" },
      { name: "Xà lách, rau thơm, giá", quantity: null, unit: "", notes: "Rửa sạch, để ráo" },
      { name: "Tương đậu phộng", quantity: 100, unit: "ml", notes: "Nước chấm" },
    ],
    steps: [
      { title: "Luộc nguyên liệu", description: "Luộc chín tôm và thịt ba chỉ, để nguội rồi bóc vỏ tôm, thái thịt thành lát mỏng.", timerMinutes: 15 },
      { title: "Chuẩn bị rau", description: "Rửa rau sống, để ráo nước; trụng bún tươi qua nước sôi rồi để ráo.", timerMinutes: null },
      { title: "Cuốn gỏi", description: "Nhúng bánh tráng vào nước ấm, xếp rau, bún, thịt, tôm rồi cuốn chặt tay, gập hai đầu lại.", timerMinutes: null },
      { title: "Thưởng thức", description: "Bày gỏi cuốn ra đĩa, dùng kèm tương đậu phộng hoặc nước mắm chua ngọt.", timerMinutes: null },
    ],
    nutrition: { calories: 220, protein: 18, carbohydrates: 28, fat: 5, fiber: 3, sodium: 650 },
  },
  {
    title: "Cơm tấm sườn bì chả",
    description: "Cơm tấm Sài Gòn với sườn nướng thơm lừng mật ong, bì dai giòn, chả trứng béo và nước mắm chua ngọt.",
    categoryHints: ["món chính", "cơm", "việt"],
    prepTimeMinutes: 40,
    cookTimeMinutes: 30,
    servings: 3,
    difficulty: RecipeDifficulty.Medium,
    instructions: "Ướp sườn ít nhất 2 giờ, để tủ lạnh qua đêm sẽ thấm vị hơn.",
    cover: "com-tam-cover.jpg",
    stepImages: { 0: "com-tam-step-0.jpg", 1: "com-tam-step-1.jpg", 2: "com-tam-step.jpg", 3: "com-tam-step-3.jpg" },
    ingredients: [
      { name: "Sườn cốt lết", quantity: 500, unit: "g" },
      { name: "Gạo tấm", quantity: 300, unit: "g" },
      { name: "Bì heo", quantity: 150, unit: "g" },
      { name: "Trứng gà", quantity: 4, unit: "quả", notes: "Làm chả trứng" },
      { name: "Sả, tỏi, mật ong", quantity: null, unit: "", notes: "Dùng để ướp sườn" },
      { name: "Nước mắm pha chua ngọt", quantity: 100, unit: "ml" },
    ],
    steps: [
      { title: "Ướp sườn", description: "Trộn sườn với sả băm, tỏi, mật ong, nước mắm, dầu hào và ướp tối thiểu 2 giờ.", timerMinutes: 120 },
      { title: "Nấu cơm tấm", description: "Vo gạo tấm, nấu với lượng nước vừa phải đến khi cơm chín tơi.", timerMinutes: 25 },
      { title: "Nướng sườn", description: "Nướng sườn trên than hoặc chảo nóng, phết thêm mật ong đến khi vàng cạnh, thơm lừng.", timerMinutes: 20 },
      { title: "Bày dĩa", description: "Xếp cơm, sườn, bì, chả trứng lên đĩa, thêm dưa leo, cà chua và chan nước mắm.", timerMinutes: null },
    ],
    nutrition: { calories: 720, protein: 38, carbohydrates: 82, fat: 25, fiber: 3, sodium: 1400 },
  },
  {
    title: "Bún chả Hà Nội",
    description: "Chả nướng than hoa thơm phức ăn cùng bún tươi, rau sống và bát nước chấm chua ngọt đặc trưng.",
    categoryHints: ["món chính", "bún", "việt"],
    prepTimeMinutes: 30,
    cookTimeMinutes: 25,
    servings: 4,
    difficulty: RecipeDifficulty.Medium,
    instructions: "Nước chấm ngon nhất khi thêm vài lát đu đủ xanh và cà rốt ngâm chua ngọt.",
    cover: "bun-cha-cover.jpg",
    stepImages: { 0: "bun-cha-step-0.jpg", 1: "bun-cha-step-1.jpg", 2: "bun-cha-step.jpg", 3: "bun-cha-step-3.jpg" },
    ingredients: [
      { name: "Thịt ba chỉ", quantity: 400, unit: "g", notes: "Thái miếng vừa ăn" },
      { name: "Thịt xay", quantity: 300, unit: "g", notes: "Vo viên làm chả" },
      { name: "Bún tươi", quantity: 600, unit: "g" },
      { name: "Hành khô, tỏi, đường, nước mắm", quantity: null, unit: "", notes: "Ướp thịt và pha nước chấm" },
      { name: "Rau sống, rau thơm", quantity: null, unit: "", notes: "Kinh giới, tía tô, xà lách" },
    ],
    steps: [
      { title: "Ướp thịt", description: "Ướp thịt ba chỉ và thịt xay với hành khô, tỏi, đường, nước mắm, tiêu trong 30 phút.", timerMinutes: 30 },
      { title: "Pha nước chấm", description: "Hòa nước mắm, đường, giấm, nước lọc và tỏi ớt, đun nhẹ cho tan đường rồi để nguội.", timerMinutes: 5 },
      { title: "Nướng chả", description: "Nướng thịt và chả viên trên than hoa đến khi chín vàng, thả vào bát nước chấm.", timerMinutes: 15 },
      { title: "Thưởng thức", description: "Dọn bún, rau sống cùng bát nước chấm có chả nướng nóng hổi.", timerMinutes: null },
    ],
    nutrition: { calories: 580, protein: 30, carbohydrates: 65, fat: 20, fiber: 4, sodium: 1100 },
  },
  {
    title: "Bánh mì thịt nướng",
    description: "Ổ bánh mì giòn rụm kẹp thịt nướng thơm, đồ chua, rau thơm và chút ớt cay trứ danh đường phố Việt Nam.",
    categoryHints: ["ăn sáng", "bánh", "món nhẹ", "việt"],
    prepTimeMinutes: 20,
    cookTimeMinutes: 20,
    servings: 2,
    difficulty: RecipeDifficulty.Easy,
    instructions: "Hâm nóng ổ bánh mì vài phút trước khi kẹp để vỏ giòn lại.",
    cover: "banh-mi-cover.jpg",
    stepImages: { 0: "banh-mi-step-0.jpg", 1: "banh-mi-step-1.jpg", 2: "banh-mi-step.jpg" },
    ingredients: [
      { name: "Bánh mì", quantity: 2, unit: "ổ" },
      { name: "Thịt heo nướng", quantity: 200, unit: "g" },
      { name: "Đồ chua (cà rốt, củ cải)", quantity: 100, unit: "g" },
      { name: "Dưa leo, ngò rí, ớt", quantity: null, unit: "" },
      { name: "Pate và bơ", quantity: 2, unit: "muỗng canh" },
    ],
    steps: [
      { title: "Nướng thịt", description: "Ướp thịt với tỏi, đường, nước mắm rồi nướng chín vàng, thái lát mỏng.", timerMinutes: 20 },
      { title: "Làm nóng bánh", description: "Nướng bánh mì trong lò hoặc chảo vài phút cho vỏ giòn, rạch dọc ổ bánh.", timerMinutes: 5 },
      { title: "Kẹp bánh mì", description: "Phết pate, bơ, xếp thịt, đồ chua, dưa leo, ngò rí, thêm ớt tùy khẩu vị.", timerMinutes: null },
    ],
    nutrition: { calories: 480, protein: 24, carbohydrates: 55, fat: 17, fiber: 3, sodium: 950 },
  },
];
