import type { AreaOfExpertise } from "@/core/types/AreaOfExpertise";
import { areaFixtures } from "./AreaFixtures";
const key = "ciee-areas-demo-v1";
let rows: AreaOfExpertise[] | undefined;
export function readMockAreas(): AreaOfExpertise[] {
  if (rows) return rows;
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(key) ?? "null");
    if (
      Array.isArray(stored) &&
      stored.every(
        (row) =>
          row &&
          typeof row.id === "string" &&
          typeof row.name === "string" &&
          typeof row.description === "string",
      )
    ) {
      rows = stored;
      return rows!;
    }
  } catch {
    /* O catálogo continua em memória quando não há armazenamento. */
  }
  rows = areaFixtures.map((row) => ({ ...row }));
  return rows;
}
export function persistMockAreas() {
  try {
    localStorage.setItem(key, JSON.stringify(rows));
  } catch {
    /* Armazenamento opcional na demonstração. */
  }
}
export function resetMockAreas() {
  rows = undefined;
  try {
    localStorage.removeItem(key);
  } catch {
    /* Ambiente sem armazenamento. */
  }
}
