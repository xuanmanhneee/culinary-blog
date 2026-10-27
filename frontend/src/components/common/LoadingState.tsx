export function LoadingState({ label = "Đang chuẩn bị món ngon..." }: { label?: string }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-4 text-center" role="status">
      <span className="relative block size-12 rounded-full border-2 border-[#d9cdbd] border-t-[#b65338] motion-safe:animate-spin" />
      <p className="text-sm font-semibold text-[#6b625a]">{label}</p>
    </div>
  );
}
