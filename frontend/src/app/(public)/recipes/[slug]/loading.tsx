import { Skeleton } from "@/components/ui/skeleton";

/** Khung chờ theo đúng bố cục trang chi tiết để nội dung không bị nhảy khi tải xong. */
export default function RecipeDetailLoading() {
  return (
    <div className="site-container py-10 sm:py-14" aria-busy="true" aria-label="Đang tải công thức">
      <Skeleton className="h-3 w-48 bg-[#e4d8ca]" />
      <div className="mx-auto mt-10 flex max-w-4xl flex-col items-center gap-5">
        <Skeleton className="h-6 w-24 rounded-full bg-[#e4d8ca]" />
        <Skeleton className="h-14 w-full max-w-2xl bg-[#e4d8ca]" />
        <Skeleton className="h-4 w-full max-w-xl bg-[#e4d8ca]" />
        <Skeleton className="h-4 w-2/3 max-w-md bg-[#e4d8ca]" />
      </div>
      <Skeleton className="mt-12 aspect-[16/8.2] min-h-[360px] w-full rounded-[2rem] bg-[#e4d8ca]" />
      <div className="mx-auto grid max-w-5xl gap-14 py-20 lg:grid-cols-[.72fr_1.28fr]">
        <Skeleton className="h-96 rounded-[1.5rem] bg-[#efe5d8]" />
        <div className="space-y-6">
          {Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-24 bg-[#e4d8ca]" />)}
        </div>
      </div>
    </div>
  );
}
