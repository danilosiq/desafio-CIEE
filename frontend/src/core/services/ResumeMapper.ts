import type { Resume } from "@/core/types/Resume";
export type ApiResume = Omit<
  Resume,
  "phone" | "areaOfExpertise" | "professionalSummary"
> & {
  phone: string | null;
  areaOfExpertise: string | null;
  professionalSummary: string | null;
};
export function normalizeResume(data: ApiResume): Resume {
  return {
    ...data,
    phone: data.phone ?? "",
    areaOfExpertise: data.areaOfExpertise ?? "",
    professionalSummary: data.professionalSummary ?? "",
  };
}
