"use client";
import { useReducedMotion } from "@/core/hooks/UseReducedMotion";
import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";
type AnimatedContentProps = { children: ReactNode; contentKey: string };
export function AnimatedContent({
  children,
  contentKey,
}: AnimatedContentProps) {
  const reduced = useReducedMotion();
  return (
    <AnimatePresence initial={false} mode="wait">
      <motion.div
        key={contentKey}
        initial={reduced ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: reduced ? 0 : 8 }}
        transition={{ duration: reduced ? 0 : 0.15, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
