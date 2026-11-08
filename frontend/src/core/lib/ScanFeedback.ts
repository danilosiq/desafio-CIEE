import type { ScanResult } from "@/core/types/Resume";

export function scanFeedback(result: ScanResult): string {
  const fields = [
    ["nome", result.data.name],
    ["e-mail", result.data.email],
    ["telefone", result.data.phone],
  ] as const;
  const found = fields.filter(([, value]) => !!value).map(([label]) => label);
  const missing = fields.filter(([, value]) => !value).map(([label]) => label);
  const intro = found.length
    ? `Identificados: ${found.join(", ")}.`
    : "Nenhum dado foi identificado.";
  const absent = missing.length
    ? ` Não identificados: ${missing.join(", ")}.`
    : "";
  const email = result.warnings.includes("AMBIGUOUS_EMAIL")
    ? " Foram encontrados e-mails diferentes; informe o correto."
    : "";
  const phone = result.warnings.includes("AMBIGUOUS_PHONE")
    ? " Foram encontrados telefones diferentes; informe o correto."
    : "";
  return `${intro}${absent}${email}${phone} Revise e complete os dados antes de salvar.`;
}
