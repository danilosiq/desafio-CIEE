import * as React from "react";
import { cn } from "@/core/lib/Utils";
export type InputProps = React.ComponentProps<"input">;
export function Input({ className, type, ...props }: InputProps) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-800 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:opacity-60 aria-invalid:border-red-500",
        className,
      )}
      {...props}
    />
  );
}
