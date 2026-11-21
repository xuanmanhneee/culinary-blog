import { Skeleton } from "@/components/ui/skeleton";

/** Khung chờ theo đúng bố cục trang chi tiết để nội dung không bị nhảy khi tải xong. */
export default function RecipeDetailLoading() {
  return (
    <div className="site-container py-6 sm:py-14" aria-busy="true" aria-label="Đang tải công thức">
      <Skeleton className="h-3 w-48 bg-muted" />
      <div className="mx-auto mt-10 flex max-w-4xl flex-col items-center gap-5">
        <Skeleton className="h-6 w-24 rounded-full bg-muted" />
        <Skeleton className="h-14 w-full max-w-2xl bg-muted" />
        <Skeleton className="h-4 w-full max-w-xl bg-muted" />
        <Skeleton className="h-4 w-2/3 max-w-md bg-muted" />
      </div>
      <Skeleton className="mt-8 aspect-[4/3] w-full rounded-2xl bg-muted sm:mt-12 sm:aspect-[16/7] sm:min-h-[360px] sm:rounded-2xl" />
      <div className="mx-auto grid max-w-6xl gap-6 py-14 sm:py-20 lg:grid-cols-2">
        <Skeleton className="h-96 rounded-2xl bg-muted" />
        <div className="space-y-6">
          {Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-24 bg-muted" />)}
        </div>
      </div>
    </div>
  );
}
