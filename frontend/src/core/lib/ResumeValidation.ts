import { z } from "zod";
import type { ResumeErrors, ResumeInput } from "@/core/types/Resume";
export const MAX_PDF_BYTES = 5 * 1024 * 1024;
export const EMPTY_RESUME: ResumeInput = {
  fullName: "",
  email: "",
  phone: "",
  interestArea: "",
  professionalSummary: "",
};
export const resumeSchema = z.object({
  fullName: z.string().trim().min(1, "Informe o nome completo."),
  email: z
    .string()
    .trim()
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Informe um e-mail válido."),
  phone: z.string().trim(),
  interestArea: z.string().trim(),
  professionalSummary: z.string().trim(),
  areaOfExpertiseId: z.string().nullable().optional(),
});
export const resumeFormSchema = resumeSchema
  .extend({ areaChoice: z.string() })
  .superRefine((data, context) => {
    if (data.areaChoice === "__other" && !data.interestArea.trim())
      context.addIssue({
        code: "custom",
        path: ["interestArea"],
        message: "Informe a área de atuação.",
      });
  });
export function validateResume(input: ResumeInput): ResumeErrors {
  const result = resumeSchema.safeParse(input);
  if (result.success) return {};
  const errors: ResumeErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0] as keyof ResumeInput;
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}
export function formatPhone(input: string): string {
  const digits = input.replace(/\D/g, "").slice(0, 11);
  if (!digits) return "";
  if (digits.length < 3) return `(${digits}`;
  const area = digits.slice(0, 2);
  const rest = digits.slice(2);
  const prefix = rest.length > 8 ? 5 : 4;
  return `(${area}) ${rest.slice(0, prefix)}${rest.length > prefix ? `-${rest.slice(prefix)}` : ""}`;
}
export function validatePdf(file: File): string | null {
  if (file.type !== "application/pdf" || !/\.pdf$/i.test(file.name))
    return "Selecione um arquivo no formato PDF.";
  if (!file.size) return "O PDF está vazio. Escolha outro arquivo.";
  if (file.size > MAX_PDF_BYTES) return "O arquivo deve ter no máximo 5 MB.";
  return null;
}
