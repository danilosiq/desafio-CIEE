export type ResumeInput = {
  fullName: string;
  email: string;
  phone: string;
  areaOfExpertise: string;
  areaOfExpertiseId?: string | null;
  professionalSummary: string;
};
export type Resume = ResumeInput & {
  id: string;
  createdAt: string;
  updatedAt: string;
};
export type ResumeFormValues = ResumeInput & { areaChoice: string };
export type ResumeErrors = Partial<Record<keyof ResumeFormValues, string>>;
export type ScanResult = {
  data: {
    name: string | null;
    email: string | null;
    phone: string | null;
    professionalSummary?: string | null;
  };
  warnings: string[];
  extraction: { status: "success" | "partial"; method: "text-rules" };
};
