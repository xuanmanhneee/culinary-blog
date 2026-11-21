import * as React from "react";
import { fieldClass } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea data-slot="textarea" className={cn(fieldClass, "field-sizing-content h-auto min-h-24 py-3 leading-6", className)} {...props} />;
}

export { Textarea };
