import { normalizeEmail } from "../domain/NormalizeEmail";

export class InvalidResumeDataError extends Error {
  constructor(readonly details: Record<string, string>) {
    const fields = Object.values(details);
    super(fields.length ? `Dados inválidos: ${fields.join(" ")}` : "Dados inválidos.");
    this.name = "InvalidResumeDataError";
  }
}

type ResumePayload = {
  fullName?: unknown;
  email?: unknown;
  phone?: unknown;
  areaOfExpertise?: unknown;
  professionalSummary?: unknown;
};

export type ValidResumeInput = {
  fullName: string;
  email: string;
  phone: string | null;
  areaOfExpertise: string | null;
  professionalSummary: string | null;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function optionalText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text === "" ? null : text;
}

export function validateResumeInput(payload: ResumePayload): ValidResumeInput {
  const details: Record<string, string> = {};
  const fullName = typeof payload.fullName === "string" ? payload.fullName.trim() : "";
  if (!fullName) details.fullName = "Informe o nome completo.";
  const email = typeof payload.email === "string" ? normalizeEmail(payload.email) : "";
  if (!email) details.email = "Informe um e-mail.";
  else if (!emailPattern.test(email)) details.email = "Informe um e-mail válido.";
  const phone = optionalText(payload.phone);
  const areaOfExpertise = optionalText(payload.areaOfExpertise);
  const professionalSummary = optionalText(payload.professionalSummary);
  if (Object.keys(details).length) throw new InvalidResumeDataError(details);
  return { fullName, email, phone, areaOfExpertise, professionalSummary };
}
