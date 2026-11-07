"use client";
import { useReducedMotion } from "@/core/hooks/UseReducedMotion";
import { AnimatePresence, motion } from "motion/react";
import { useId, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  Popover,
  PopoverTrigger,
  PopoverPortal,
  PopoverContent,
} from "@/components/ui/Popover";
export type ResumeSort = "alphabetical" | "oldest" | "newest";
type ResumeSortMenuProps = {
  value: ResumeSort;
  onChange: (value: ResumeSort) => void;
};
export function ResumeSortMenu({ value, onChange }: ResumeSortMenuProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const reduced = useReducedMotion();
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Organizar candidatos"
          title="Organizar candidatos"
          className="size-9 text-slate-500 data-[state=open]:bg-blue-50 data-[state=open]:text-blue-950"
        >
          <SlidersHorizontal aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverPortal forceMount>
        <AnimatePresence>
          {open && (
            <PopoverContent
              key="sort-menu"
              forceMount
              asChild
              align="start"
              sideOffset={8}
              collisionPadding={16}
              aria-label="Ordenação dos candidatos"
              className="z-30 w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 bg-white p-4 shadow-lg outline-none"
            >
              <motion.div
                initial={reduced ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: reduced ? 0 : 8 }}
                transition={{ duration: reduced ? 0 : 0.15, ease: "easeOut" }}
              >
                <label
                  htmlFor={id}
                  className="mb-2 block text-sm font-semibold text-blue-950"
                >
                  Organizar por
                </label>
                <select
                  id={id}
                  value={value}
                  onChange={(event) =>
                    onChange(event.target.value as ResumeSort)
                  }
                  className="h-11 w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-blue-800"
                >
                  <option value="alphabetical">Ordem alfabética</option>
                  <option value="oldest">Alterações mais antigas</option>
                  <option value="newest">Alterações mais novas</option>
                </select>
              </motion.div>
            </PopoverContent>
          )}
        </AnimatePresence>
      </PopoverPortal>
    </Popover>
  );
}
