import { OllamaResumeExtractionProvider, mapExtractionFailure } from "../../src/modules/resume-processing/infra/providers/OllamaResumeExtractionProvider";
import { ollamaInferenceConfig } from "../../src/infra/ollama/OllamaConfig";

it("distingue tempo limite de indisponibilidade com orientação para cadastro manual", () => {
  expect(mapExtractionFailure(new DOMException("timeout", "TimeoutError"))).toMatchObject({ code: "TIMEOUT", message: expect.stringContaining("manualmente") });
  expect(mapExtractionFailure(new TypeError("fetch failed"))).toMatchObject({ code: "UNAVAILABLE", message: expect.stringContaining("manualmente") });
});
it("rejeita entrada sem imagens antes de chamar o runtime", async () => {
  const provider = new OllamaResumeExtractionProvider(ollamaInferenceConfig({}));
  await expect(provider.extract([])).rejects.toMatchObject({ code: "INVALID_INPUT" });
});
it("retorna indisponibilidade quando o runtime local não está acessível", async () => {
  const provider = new OllamaResumeExtractionProvider(ollamaInferenceConfig({ OLLAMA_BASE_URL: "http://127.0.0.1:1", OLLAMA_TIMEOUT_MS: "1000" }));
  await expect(provider.extract([new Uint8Array([1])])).rejects.toMatchObject({ code: "UNAVAILABLE" });
});
it("valida configuração de recursos", () => {
  expect(ollamaInferenceConfig({ OLLAMA_TIMEOUT_MS: "3000", OLLAMA_CONTEXT: "8192", OLLAMA_CONCURRENCY: "2" })).toMatchObject({ timeoutMs: 3000, context: 8192, concurrency: 2 });
  expect(() => ollamaInferenceConfig({ OLLAMA_CONCURRENCY: "0" })).toThrow("OLLAMA_CONCURRENCY");
});
