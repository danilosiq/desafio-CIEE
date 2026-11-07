import { ollamaConfig } from "./OllamaConfig";

type ModelEntry = { name: string; digest: string; size: number; modified_at?: string; details?: { quantization_level?: string; parameter_size?: string } };
export function findConfiguredModel(models: ModelEntry[], model: string): ModelEntry | undefined {
  return models.find((entry) => entry.name === model);
}

export type OllamaStatus =
  | { status: "ready"; model: string; version: string; digest: string; sizeBytes: number; quantization?: string; parameters?: string }
  | { status: "runtime_unavailable" | "model_missing" | "invalid_config"; model: string; message: string };

export async function checkOllama(): Promise<OllamaStatus> {
  let config: ReturnType<typeof ollamaConfig>;
  try { config = ollamaConfig(); } catch (error) {
    return { status: "invalid_config", model: "qwen2.5vl:7b", message: error instanceof Error ? error.message : "Configuração inválida." };
  }
  try {
    const [versionResponse, tagsResponse] = await Promise.all([
      fetch(`${config.baseUrl}/api/version`, { signal: AbortSignal.timeout(3000) }),
      fetch(`${config.baseUrl}/api/tags`, { signal: AbortSignal.timeout(3000) }),
    ]);
    if (!versionResponse.ok || !tagsResponse.ok) throw new Error("Ollama não respondeu corretamente.");
    const version = await versionResponse.json() as { version?: unknown };
    const tags = await tagsResponse.json() as { models?: unknown };
    if (typeof version.version !== "string" || !Array.isArray(tags.models)) throw new Error("Resposta inválida do Ollama.");
    const found = findConfiguredModel(tags.models as ModelEntry[], config.model);
    if (!found) return { status: "model_missing", model: config.model, message: `Modelo ausente. No Docker, verifique os logs do serviço ollama-setup; no Ollama local, execute: ollama pull ${config.model}` };
    if (typeof found.digest !== "string" || typeof found.size !== "number") throw new Error("Metadados do modelo inválidos.");
    return { status: "ready", model: found.name, version: version.version, digest: found.digest, sizeBytes: found.size, quantization: found.details?.quantization_level, parameters: found.details?.parameter_size };
  } catch {
    return { status: "runtime_unavailable", model: config.model, message: `Ollama indisponível em ${config.baseUrl}. Instale e inicie o runtime Ollama; confira OLLAMA_BASE_URL.` };
  }
}
