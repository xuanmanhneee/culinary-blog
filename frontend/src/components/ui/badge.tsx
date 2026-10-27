import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em]", {
  variants: {
    variant: {
      default: "bg-[#e4eee7] text-[#1f4b3f]",
      warm: "bg-[#f3dfcf] text-[#9b432d]",
      outline: "border border-[#d9cdbd] bg-white/70 text-[#665e57]",
    },
  },
  defaultVariants: { variant: "default" },
});

export function Badge({ className, variant, ...props }: HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
