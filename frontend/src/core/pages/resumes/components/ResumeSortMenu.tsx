"use client";
import { useReducedMotion } from "@/core/hooks/UseReducedMotion";
import { useAreas } from "@/core/hooks/UseAreas";
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
  areaOfExpertiseId?: string;
  onAreaChange?: (value: string) => void;
};
export function ResumeSortMenu({
  value,
  onChange,
  areaOfExpertiseId = "",
  onAreaChange,
}: ResumeSortMenuProps) {
  const sortId = useId();
  const areaId = useId();
  const [open, setOpen] = useState(false);
  const reduced = useReducedMotion();
  const areas = useAreas();
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Organizar e filtrar candidatos"
          title="Organizar e filtrar candidatos"
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
              aria-label="Organização e filtro dos candidatos"
              className="z-30 w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 bg-white p-4 shadow-lg outline-none"
            >
              <motion.div
                initial={reduced ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: reduced ? 0 : 8 }}
                transition={{ duration: reduced ? 0 : 0.15, ease: "easeOut" }}
                className="grid gap-4"
              >
                <div>
                  <label
                    htmlFor={sortId}
                    className="mb-2 block text-sm font-semibold text-blue-950"
                  >
                    Organizar e filtrar por
                  </label>
                  <select
                    id={sortId}
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
                </div>
                <div>
                  <label
                    htmlFor={areaId}
                    className="mb-2 block text-sm font-semibold text-blue-950"
                  >
                    Área de atuação
                  </label>
                  <select
                    id={areaId}
                    value={areaOfExpertiseId}
                    onChange={(event) => onAreaChange?.(event.target.value)}
                    className="h-11 w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-blue-800"
                  >
                    <option value="">Todas as áreas</option>
                    {(areas.data ?? []).map((area) => (
                      <option key={area.id} value={area.id}>
                        {area.name}
                      </option>
                    ))}
                  </select>
                </div>
              </motion.div>
            </PopoverContent>
          )}
        </AnimatePresence>
      </PopoverPortal>
    </Popover>
  );
}
