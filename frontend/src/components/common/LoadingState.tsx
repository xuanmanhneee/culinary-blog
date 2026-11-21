export function LoadingState({ label = "Đang chuẩn bị món ngon..." }: { label?: string }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-4 text-center" role="status">
      <span className="relative block size-12 rounded-full border-2 border-border border-t-accent motion-safe:animate-spin" />
      <p className="text-sm font-semibold text-muted-foreground">{label}</p>
    </div>
  );
}
