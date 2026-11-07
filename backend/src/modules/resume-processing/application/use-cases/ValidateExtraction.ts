import { ExtractionError, type ExtractedResumeFields } from "../providers/ResumeExtractionProvider";

export function validateExtraction(value: unknown): ExtractedResumeFields {
  const invalid = (): never => { throw new ExtractionError("INVALID_RESPONSE", "A resposta da extração é inválida. Preencha os dados manualmente."); };
  if (!value || typeof value !== "object" || Array.isArray(value)) return invalid();
  const data = value as Record<string, unknown>;
  if (Object.keys(data).length !== 3 || !["fullName", "email", "phone"].every((key) => Object.hasOwn(data, key))) return invalid();
  if (![data.fullName, data.email, data.phone].every((v) => v === null || typeof v === "string")) return invalid();
  const fullName = typeof data.fullName === "string" ? data.fullName.trim() : null;
  const email = typeof data.email === "string" ? data.email.trim() : null;
  const phone = typeof data.phone === "string" ? data.phone.trim() : null;
  if (fullName !== null && (fullName.length < 2 || fullName.length > 200 || !/^[\p{L}\p{M}][\p{L}\p{M}' .-]*$/u.test(fullName) || /\b(ignore|instruções|instrucoes|instrução|instruction|system|prompt)\b/iu.test(fullName))) return invalid();
  if (email !== null && (email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email))) return invalid();
  if (phone !== null && (!/^[+\d().\s-]+$/u.test(phone) || phone.replace(/\D/g, "").length < 8 || phone.replace(/\D/g, "").length > 15)) return invalid();
  return { fullName, email, phone };
}
