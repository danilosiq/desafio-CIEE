import type { ResumeFormValues, ScanResult } from "@/core/types/Resume";

type SuggestedFields = "fullName" | "email" | "phone";
export function selectScanSuggestions(
  result: ScanResult,
  edited: ReadonlySet<keyof ResumeFormValues>,
  current: Partial<Pick<ResumeFormValues, SuggestedFields>> = {},
): Partial<Pick<ResumeFormValues, SuggestedFields>> {
  const values = {
    fullName: result.data.name,
    email: result.data.email,
    phone: result.data.phone,
  };
  const selected: Partial<Pick<ResumeFormValues, SuggestedFields>> = {};
  for (const name of ["fullName", "email", "phone"] as const) {
    if (!edited.has(name) && !current[name]?.trim() && values[name])
      selected[name] = values[name];
  }
  return selected;
}
