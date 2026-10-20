import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all outline-none focus-visible:ring-2 focus-visible:ring-[#1f4b3f]/35 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-[#1f4b3f] text-white shadow-[0_8px_24px_rgba(31,75,63,.18)] hover:-translate-y-0.5 hover:bg-[#16382f]",
        secondary: "bg-[#efe4d3] text-[#3a2f27] hover:bg-[#e5d4bd]",
        outline: "border border-[#d9cdbd] bg-white/70 text-[#2e2925] hover:border-[#1f4b3f] hover:text-[#1f4b3f]",
        ghost: "text-[#4e4741] hover:bg-[#f2eadf] hover:text-[#1f4b3f]",
        destructive: "bg-[#b5442f] text-white hover:bg-[#963522]",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 px-4 text-xs",
        lg: "h-13 px-7 text-base",
        icon: "size-10 p-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

function Button({ className, variant, size, asChild = false, ...props }: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
