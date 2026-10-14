interface ErrorStateProps {
  message: string;
  title?: string;
  onRetry?: () => void;
}

export default function ErrorState({
  message,
  title = "Đã xảy ra lỗi",
  onRetry,
}: ErrorStateProps) {
  return (
    <section role="alert" className="rounded-md border border-red-200 bg-red-50 p-4 text-red-800">
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-1 text-sm">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium hover:bg-red-100"
        >
          Thử lại
        </button>
      )}
    </section>
  );
}
