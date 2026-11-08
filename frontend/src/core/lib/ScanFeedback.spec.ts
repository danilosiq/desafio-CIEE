import { scanFeedback } from "./ScanFeedback";
import type { ScanResult } from "@/core/types/Resume";
const base: ScanResult = {
  data: { name: "Ana Lima", email: null, phone: null },
  warnings: [],
  extraction: { status: "partial", method: "text-rules" },
};
it("identifica os campos encontrados e ausentes sem perder o aviso de revisão", () => {
  expect(scanFeedback(base)).toContain("Identificados: nome");
  expect(scanFeedback(base)).toContain("Não identificados: e-mail, telefone");
  expect(scanFeedback(base)).toMatch(/revise/i);
});
it("explica resultados ambíguos sem escolher valores", () => {
  expect(
    scanFeedback({ ...base, warnings: ["AMBIGUOUS_EMAIL", "AMBIGUOUS_PHONE"] }),
  ).toMatch(/e-mails diferentes/);
  expect(
    scanFeedback({ ...base, warnings: ["AMBIGUOUS_EMAIL", "AMBIGUOUS_PHONE"] }),
  ).toMatch(/telefones diferentes/);
});
it("informa quando nenhum dado foi identificado", () => {
  const result: ScanResult = {
    ...base,
    data: { name: null, email: null, phone: null },
    warnings: ["NO_FIELDS_IDENTIFIED"],
  };
  expect(scanFeedback(result)).toMatch(/nenhum dado/i);
});
