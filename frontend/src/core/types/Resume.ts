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
  fullName: string | null;
  email: string | null;
  phone: string | null;
};
