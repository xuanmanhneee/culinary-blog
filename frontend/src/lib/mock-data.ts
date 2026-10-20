export interface FeaturedRecipe {
  slug: string;
  title: string;
  excerpt: string;
  image: string;
  category: string;
  time: number;
  difficulty: "Dễ" | "Trung bình" | "Khó";
  author: string;
  rating: number;
}

export const featuredRecipes: FeaturedRecipe[] = [
  {
    slug: "bun-cha-ha-noi",
    title: "Bún chả Hà Nội thơm lừng căn bếp",
    excerpt: "Chả nướng xém cạnh, nước mắm chua ngọt và một rổ rau xanh mát.",
    image: "https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&w=1200&q=85",
    category: "Món Việt",
    time: 45,
    difficulty: "Trung bình",
    author: "An Nhiên",
    rating: 4.9,
  },
  {
    slug: "pasta-cherry-tomato",
    title: "Pasta cà chua bi cho ngày thong thả",
    excerpt: "Một món tối gọn nhẹ với cà chua mọng, lá húng quế và phô mai.",
    image: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=1200&q=85",
    category: "Món Âu",
    time: 30,
    difficulty: "Dễ",
    author: "Minh Châu",
    rating: 4.8,
  },
  {
    slug: "salad-mua-he",
    title: "Salad mùa hè giòn mát",
    excerpt: "Rau quả theo mùa, sốt chanh mật ong và những hạt hạnh nhân rang.",
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=85",
    category: "Lành mạnh",
    time: 20,
    difficulty: "Dễ",
    author: "Hà My",
    rating: 4.7,
  },
  {
    slug: "banh-mi-bo-toi",
    title: "Bánh mì bơ tỏi nướng vàng",
    excerpt: "Vỏ ngoài giòn rụm, ruột mềm thơm bơ và một chút ngò tây tươi.",
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=85",
    category: "Làm bánh",
    time: 55,
    difficulty: "Trung bình",
    author: "Gia Bảo",
    rating: 4.9,
  },
  {
    slug: "ca-hoi-ap-chao",
    title: "Cá hồi áp chảo sốt thảo mộc",
    excerpt: "Da cá giòn, phần thịt mọng mềm cùng sốt chanh thảo mộc thanh nhẹ.",
    image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=1200&q=85",
    category: "Bữa tối",
    time: 35,
    difficulty: "Trung bình",
    author: "Đức Anh",
    rating: 4.8,
  },
  {
    slug: "pancake-trai-cay",
    title: "Pancake trái cây cuối tuần",
    excerpt: "Những lớp bánh bông xốp, trái cây tươi và chút mật ong dịu ngọt.",
    image: "https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=1200&q=85",
    category: "Bữa sáng",
    time: 25,
    difficulty: "Dễ",
    author: "Thảo Vy",
    rating: 4.9,
  },
];

export const categories = [
  { name: "Món Việt", icon: "🍜", count: 42, color: "#e9d9c7" },
  { name: "Món chay", icon: "🥬", count: 28, color: "#dce8d9" },
  { name: "Làm bánh", icon: "🥐", count: 36, color: "#f2dfc0" },
  { name: "Bữa sáng", icon: "🍳", count: 31, color: "#f1d8cd" },
  { name: "Đồ uống", icon: "🍹", count: 19, color: "#d9e9e5" },
  { name: "Nhanh gọn", icon: "⏱️", count: 24, color: "#e8dfd6" },
];
