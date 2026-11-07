import { ollamaConfig } from "../../src/infra/ollama/OllamaConfig";
import { checkOllama, findConfiguredModel } from "../../src/infra/ollama/OllamaAvailability";

it("usa o modelo definido e permite configurar o endereço local", () => {
  expect(ollamaConfig({ OLLAMA_BASE_URL: "http://localhost:11435", OLLAMA_MODEL: "qwen2.5vl:7b" })).toEqual({ baseUrl: "http://localhost:11435", model: "qwen2.5vl:7b" });
});
it("aceita o serviço Ollama na rede do Compose", () => {
  expect(ollamaConfig({ OLLAMA_BASE_URL: "http://ollama:11434" }).baseUrl).toBe("http://ollama:11434");
});
it("rejeita outro modelo e endereço externo", () => {
  expect(() => ollamaConfig({ OLLAMA_MODEL: "outro:7b" })).toThrow("qwen2.5vl:7b");
  expect(() => ollamaConfig({ OLLAMA_BASE_URL: "https://example.com" })).toThrow("local");
});
it("distingue configuração inválida antes de acessar a rede", async () => {
  const previous = process.env.OLLAMA_MODEL;
  process.env.OLLAMA_MODEL = "outro:7b";
  try { expect((await checkOllama()).status).toBe("invalid_config"); }
  finally { if (previous === undefined) delete process.env.OLLAMA_MODEL; else process.env.OLLAMA_MODEL = previous; }
});

it("não confunde outro modelo ou tag com o modelo exigido", () => {
  const installed = [{ name: "qwen2.5vl:3b", digest: "abc", size: 123 }];
  expect(findConfiguredModel(installed, "qwen2.5vl:7b")).toBeUndefined();
  expect(findConfiguredModel(installed, "qwen2.5vl:3b")).toEqual(installed[0]);
});
