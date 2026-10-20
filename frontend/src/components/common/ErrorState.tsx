import { CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ErrorState({ title = "Có chút trục trặc", message, onRetry }: { title?: string; message: string; onRetry?: () => void }) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center rounded-[1.5rem] border border-[#e1d5c7] bg-white/65 px-6 py-12 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-[#f3dfcf] text-[#a94731]"><CircleAlert /></span>
      <h2 className="font-display mt-5 text-2xl font-bold text-[#2e2925]">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-[#70675f]">{message}</p>
      {onRetry && <Button onClick={onRetry} className="mt-6">Thử lại</Button>}
    </div>
  );
}
