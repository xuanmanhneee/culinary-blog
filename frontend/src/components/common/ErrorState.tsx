import { CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  message: string;
  title?: string;
  onRetry?: () => void;
}

export function ErrorState({
  message,
  title = "Có chút trục trặc",
  onRetry,
}: ErrorStateProps) {
  return (
    <section
      role="alert"
      className="mx-auto flex max-w-lg flex-col items-center rounded-2xl border border-border bg-card px-6 py-12 text-center"
    >
      <span className="grid size-12 place-items-center rounded-full bg-accent-soft text-accent">
        <CircleAlert />
      </span>
      <h2 className="mt-5 text-2xl font-bold text-foreground">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} className="mt-6">
          Thử lại
        </Button>
      )}
    </section>
  );
}

export default ErrorState;
