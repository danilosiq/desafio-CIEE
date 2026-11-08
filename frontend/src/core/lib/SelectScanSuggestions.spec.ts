import { selectScanSuggestions } from "./SelectScanSuggestions";
import type { ScanResult } from "@/core/types/Resume";
const sample = {
  data: { name: "Ana Lima", email: "ana@example.com", phone: null },
  warnings: [],
  extraction: { status: "partial", method: "text-rules" },
} satisfies ScanResult;
it("preserva os campos que a pessoa editou e ignora valores ausentes", () => {
  expect(selectScanSuggestions(sample, new Set(["fullName"]))).toEqual({
    email: "ana@example.com",
  });
});
it("mapeia nome da extração para nome completo do formulário", () => {
  expect(selectScanSuggestions(sample, new Set())).toEqual({
    fullName: "Ana Lima",
    email: "ana@example.com",
  });
});
it("mantém todos os campos vazios quando não há sugestões", () => {
  const empty = {
    ...sample,
    data: { name: null, email: null, phone: null },
  } satisfies ScanResult;
  expect(selectScanSuggestions(empty, new Set())).toEqual({});
});
it("não substitui valores já presentes, mesmo que não estejam marcados como editados", () => {
  expect(
    selectScanSuggestions(sample, new Set(), { fullName: "Pessoa existente" }),
  ).toEqual({ email: "ana@example.com" });
});

it("preserva resumo editado", () => {
  const result = {
    ...sample,
    data: { ...sample.data, professionalSummary: "Resumo sugerido" },
  };
  expect(selectScanSuggestions(result, new Set()).professionalSummary).toBe(
    "Resumo sugerido",
  );
  expect(
    selectScanSuggestions(result, new Set(["professionalSummary"]))
      .professionalSummary,
  ).toBeUndefined();
  expect(
    selectScanSuggestions(result, new Set(), {
      professionalSummary: "Já escrito",
    }).professionalSummary,
  ).toBeUndefined();
});
