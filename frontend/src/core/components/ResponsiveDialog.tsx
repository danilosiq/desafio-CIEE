"use client";
import { useReducedMotion } from "@/core/hooks/UseReducedMotion";
import { useRef, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { cn } from "@/core/lib/Utils";
type ResponsiveDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children: ReactNode;
  compact?: boolean;
  wide?: boolean;
  returnFocusTo?: HTMLElement | null;
};
export function ResponsiveDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  compact,
  wide,
  returnFocusTo,
}: ResponsiveDialogProps) {
  const reduced = useReducedMotion();
  const returnFocus = useRef<HTMLElement | null>(null);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal forceMount>
        <AnimatePresence>
          {open && (
            <DialogOverlay key="overlay" forceMount asChild>
              <motion.div
                key="overlay"
                initial={reduced ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduced ? 0 : 0.15 }}
                className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-[2px]"
              />
            </DialogOverlay>
          )}
          {open && (
            <DialogContent
              key="content"
              forceMount
              asChild
              onOpenAutoFocus={() => {
                returnFocus.current =
                  document.activeElement instanceof HTMLElement
                    ? document.activeElement
                    : null;
              }}
              onCloseAutoFocus={(event) => {
                const target = returnFocusTo ?? returnFocus.current;
                if (target?.isConnected) {
                  event.preventDefault();
                  target.focus();
                }
              }}
              className={cn(
                "fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col overflow-hidden rounded-t-3xl border border-slate-200 bg-white pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl outline-none sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[calc(100%_-_3rem)] sm:max-w-2xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:pb-0",
                compact && "sm:max-w-md",
                wide && "md:max-w-4xl",
              )}
            >
              <motion.div
                key="content"
                initial={reduced ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: reduced ? 0 : 16 }}
                transition={{ duration: reduced ? 0 : 0.15, ease: "easeOut" }}
              >
                <div
                  aria-hidden="true"
                  className="mx-auto mb-1 mt-3 h-1 shrink-0 w-10 rounded-full bg-slate-300 sm:hidden"
                />
                <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-7">
                  <div>
                    <DialogTitle className="text-lg font-semibold tracking-tight text-blue-950">
                      {title}
                    </DialogTitle>
                    <DialogDescription className="mt-1 text-sm leading-6 text-slate-500">
                      {description}
                    </DialogDescription>
                  </div>
                  <DialogClose asChild>
                    <Button
                      aria-label="Fechar janela"
                      variant="ghost"
                      size="icon"
                    >
                      <X aria-hidden="true" />
                    </Button>
                  </DialogClose>
                </header>
                <div
                  data-testid="dialog-scroll-region"
                  className="min-h-0 flex-auto overflow-y-auto overscroll-contain"
                >
                  {children}
                </div>
              </motion.div>
            </DialogContent>
          )}
        </AnimatePresence>
      </DialogPortal>
    </Dialog>
  );
}
