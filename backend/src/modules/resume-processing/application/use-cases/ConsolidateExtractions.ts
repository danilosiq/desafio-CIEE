import type { ExtractedResumeFields, ExtractionSuggestion } from "../providers/ResumeExtractionProvider";

export type ScanResult = ExtractedResumeFields & { conflicts: (keyof ExtractedResumeFields)[]; requiresReview: true; model: string; promptVersion: string };
export function consolidateExtractions(results: ExtractionSuggestion[]): ScanResult {
  if (results.length === 0) throw new Error("Nenhuma página foi processada.");
  const { model, promptVersion } = results[0];
  if (results.some((result) => result.model !== model || result.promptVersion !== promptVersion)) throw new Error("Identificação da extração inconsistente.");
  const conflicts: (keyof ExtractedResumeFields)[] = [];
  const values = {} as ExtractedResumeFields;
  for (const field of ["fullName", "email", "phone"] as const) {
    const found = results.map((result) => result.fields[field]).filter((value): value is string => value !== null);
    const normalize = (value: string) => field === "phone" ? value.replace(/\D/g, "") : value.normalize("NFC").trim().replace(/\s+/g, " ").toLocaleLowerCase("pt-BR");
    if (new Set(found.map(normalize)).size > 1) { conflicts.push(field); values[field] = null; }
    else values[field] = found[0] ?? null;
  }
  return { ...values, conflicts, requiresReview: true, model, promptVersion };
}
