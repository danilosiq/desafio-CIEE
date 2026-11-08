export type Fields = { name: string | null; email: string | null; phone: string | null };
export type ExtractionResult = { data: Fields; warnings: string[]; extraction: { status: "success" | "partial"; method: "text-rules" } };

const strip = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const blockedWords = new Set(["curriculo", "curriculum", "resume", "perfil", "profissional", "experiencia", "formacao", "academica", "objetivo", "dados", "pessoais", "contato", "referencia", "desenvolvedor", "desenvolvedora", "engenheiro", "engenheira", "analista", "gerente", "designer", "software", "frontend", "backend", "full", "stack", "tecnologia", "tecnologias", "python", "react", "graduacao", "educacao", "nacionalidade", "brasileiro", "brasileira", "endereco", "habilidades", "competencias", "idiomas", "linkedin"]);
const referenceLine = /\b(refer[eê]ncias?|recomendante|reference)\b/i;

function chooseName(lines: string[]): string | null {
  const candidates = lines.slice(0, 12).flatMap((line, index) => {
    const value = line.replace(/^nome\s*(?:completo)?\s*:\s*/i, "").trim();
    const words = value.split(/\s+/);
    if (words.length < 2 || words.length > 5 || value.length > 100 || !/^[\p{L}\p{M}' -]+$/u.test(value)) return [];
    if (words.some((word) => blockedWords.has(strip(word)))) return [];
    const isCapitalized = words.every((word) => /^(?:de|da|do|das|dos|e)$/i.test(word) || /^\p{Lu}/u.test(word));
    if (!isCapitalized) return [];
    return [{ value, score: (index < 3 ? 3 : index < 7 ? 2 : 1) + (words.length >= 3 ? 1 : 0) }];
  });
  candidates.sort((a, b) => b.score - a.score);
  return candidates.length && (!candidates[1] || candidates[0].score > candidates[1].score) ? candidates[0].value : null;
}

export function extractFields(text: string): ExtractionResult {
  const lines = text.normalize("NFC").split(/\r?\n/).map((line) => line.replace(/[\t\u00a0 ]+/g, " ").trim()).filter(Boolean);
  const candidateLines = lines.filter((line) => !referenceLine.test(line));
  const emails = [...new Set(candidateLines.flatMap((line) => line.match(/[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?)+/gi) ?? []).map((value) => value.replace(/[.,;:)]+$/, "").toLowerCase()))];
  const phones: string[] = [];
  for (const line of candidateLines) {
    if (/\b(cpf|cnpj|cep|nascimento|data)\b/i.test(line) && !/\b(telefone|celular|whatsapp|fone|tel)\b/i.test(line)) continue;
    const matches = line.match(/(?<![\d.])(?:\+55[\s.-]*)?(?:\(?\d{2}\)?[\s.-]*)?(?:9\d{4}|[2-9]\d{3})[-.\s]?\d{4}(?![\d.-])/g) ?? [];
    for (const match of matches) {
      const value = match.trim();
      const digits = value.replace(/\D/g, "");
      if ((digits.length === 8 || digits.length === 9) && !/\b(telefone|celular|whatsapp|fone|tel)\b/i.test(line)) continue;
      if ([8, 9, 10, 11, 12, 13].includes(digits.length) && !phones.some((x) => x.replace(/\D/g, "") === digits)) phones.push(value);
    }
  }
  const data: Fields = { name: chooseName(candidateLines), email: emails.length === 1 ? emails[0] : null, phone: phones.length === 1 ? phones[0] : null };
  const warnings: string[] = [];
  if (emails.length > 1) warnings.push("AMBIGUOUS_EMAIL");
  if (phones.length > 1) warnings.push("AMBIGUOUS_PHONE");
  if (!data.name && !data.email && !data.phone) warnings.push("NO_FIELDS_IDENTIFIED");
  return { data, warnings, extraction: { status: data.name && data.email && data.phone ? "success" : "partial", method: "text-rules" } };
}
