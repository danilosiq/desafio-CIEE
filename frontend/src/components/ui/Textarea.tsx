import * as React from "react";
import { cn } from "@/core/lib/Utils";
export type TextareaProps = React.ComponentProps<"textarea">;
export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "min-h-32 w-full resize-y rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-800 focus:ring-2 focus:ring-blue-100 disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}
