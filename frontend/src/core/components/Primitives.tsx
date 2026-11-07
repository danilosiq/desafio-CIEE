import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/core/lib/Utils";
type ColumnProps = HTMLAttributes<HTMLDivElement>;
export function Column({ className, ...props }: ColumnProps) {
  return <div className={cn("flex min-w-0 flex-col", className)} {...props} />;
}
type RowProps = HTMLAttributes<HTMLDivElement>;
export function Row({ className, ...props }: RowProps) {
  return (
    <div className={cn("flex min-w-0 items-center", className)} {...props} />
  );
}
type TitleProps = HTMLAttributes<HTMLHeadingElement> & {
  as?: "h1" | "h2" | "h3";
};
export function Title({ as: Tag = "h1", className, ...props }: TitleProps) {
  return (
    <Tag
      className={cn("font-semibold tracking-tight text-slate-900", className)}
      {...props}
    />
  );
}
type TextProps = HTMLAttributes<HTMLParagraphElement>;
export function Text({ className, ...props }: TextProps) {
  return (
    <p
      className={cn("text-sm leading-6 text-slate-500", className)}
      {...props}
    />
  );
}
type PanelProps = { children: ReactNode; className?: string };
export function Panel({ children, className }: PanelProps) {
  return (
    <section
      className={cn(
        "min-w-0 rounded-xl border border-slate-200 bg-white",
        className,
      )}
    >
      {children}
    </section>
  );
}
