"use client";
import { useSyncExternalStore } from "react";
// Mantém o limite alinhado ao breakpoint sm (40rem) do Tailwind.
const query = "(width < 40rem)";
function subscribe(notify: () => void) {
  const media = window.matchMedia?.(query);
  media?.addEventListener("change", notify);
  return () => media?.removeEventListener("change", notify);
}
function getSnapshot() {
  return window.matchMedia?.(query).matches ?? false;
}
export function useIsMobile() {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
