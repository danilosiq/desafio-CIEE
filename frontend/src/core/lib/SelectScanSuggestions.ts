import type { ResumeFormValues, ScanResult } from "@/core/types/Resume";

export function selectScanSuggestions(
  result: ScanResult,
  edited: ReadonlySet<keyof ResumeFormValues>,
): Partial<Pick<ScanResult, "fullName" | "email" | "phone">> {
  const selected: Partial<Pick<ScanResult, "fullName" | "email" | "phone">> =
    {};
  for (const name of ["fullName", "email", "phone"] as const) {
    if (!edited.has(name) && !result.conflicts?.includes(name) && result[name])
      selected[name] = result[name];
  }
  return selected;
}
