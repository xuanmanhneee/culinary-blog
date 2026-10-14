interface LoadingProps {
  message?: string;
}

export default function Loading({ message = "Đang tải..." }: LoadingProps) {
  return (
    <div role="status" aria-live="polite" className="py-6 text-center text-zinc-600">
      <span
        aria-hidden="true"
        className="mr-2 inline-block size-4 animate-spin rounded-full border-2 border-zinc-300 border-t-emerald-700 align-[-3px]"
      />
      {message}
    </div>
  );
}
