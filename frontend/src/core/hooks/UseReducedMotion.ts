"use client";
import { useSyncExternalStore } from "react";
const query = "(prefers-reduced-motion: reduce)";
function subscribe(notify: () => void) {
  const media = window.matchMedia?.(query);
  media?.addEventListener("change", notify);
  return () => media?.removeEventListener("change", notify);
}
function getSnapshot() {
  return window.matchMedia?.(query).matches ?? false;
}
export function useReducedMotion() {
  return useSyncExternalStore(subscribe, getSnapshot, () => true);
}
