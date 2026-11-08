import { selectScanSuggestions } from "./SelectScanSuggestions";
import type { ScanResult } from "@/core/types/Resume";
const sample: ScanResult = {
  fullName: "Ana Lima",
  email: "ana@example.com",
  phone: null,
  conflicts: ["email"],
  requiresReview: true,
  model: "qwen2.5vl:7b",
  promptVersion: "ExtractResumeV1",
};
it("preserva os campos que a pessoa editou e ignora valores ausentes ou conflitantes", () => {
  expect(selectScanSuggestions(sample, new Set(["fullName"]))).toEqual({});
});
it("aceita sugestões sem conflito para os campos não editados", () => {
  expect(
    selectScanSuggestions({ ...sample, conflicts: [] }, new Set(["fullName"])),
  ).toEqual({ email: "ana@example.com" });
});
