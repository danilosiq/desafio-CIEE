import { consolidateExtractions } from "../../src/modules/resume-processing/application/use-cases/ConsolidateExtractions";
import type { ExtractionSuggestion } from "../../src/modules/resume-processing/application/providers/ResumeExtractionProvider";
const page = (fullName: string | null, email: string | null, phone: string | null): ExtractionSuggestion => ({ fields: { fullName, email, phone }, requiresReview: true, model: "qwen2.5vl:7b", promptVersion: "ExtractResumeV1" });
it("consolida páginas e preserva campos ausentes", () => {
  expect(consolidateExtractions([page("Ana Pereira", null, null), page(null, "ana@example.com", null)])).toMatchObject({ fullName: "Ana Pereira", email: "ana@example.com", phone: null, conflicts: [], requiresReview: true });
});
it("devolve null e sinaliza valores conflitantes sem escolher entre eles", () => {
  expect(consolidateExtractions([page("Ana Pereira", "a@example.com", null), page("Joana Lima", "b@example.com", null), page("Ana Pereira", null, null)])).toMatchObject({ fullName: null, email: null, phone: null, conflicts: ["fullName", "email"] });
});
it("reconhece diferenças apenas de caixa, espaços e formatação de telefone", () => {
  expect(consolidateExtractions([page("Ana Pereira", "ANA@example.com", "(11) 98888-0000"), page(" ana  pereira ", "ana@example.com", "11 98888 0000")])).toMatchObject({ fullName: "Ana Pereira", email: "ANA@example.com", phone: "(11) 98888-0000", conflicts: [] });
});
it("rejeita resultados sem páginas ou com modelo diferente", () => {
  expect(() => consolidateExtractions([])).toThrow();
  expect(() => consolidateExtractions([page(null, null, null), { ...page(null, null, null), model: "outro" }])).toThrow();
});
