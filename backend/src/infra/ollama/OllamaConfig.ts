export const REQUIRED_OLLAMA_MODEL = "qwen2.5vl:7b";

export function ollamaConfig(env: NodeJS.ProcessEnv = process.env): { baseUrl: string; model: string } {
  const model = env.OLLAMA_MODEL?.trim() || REQUIRED_OLLAMA_MODEL;
  if (model !== REQUIRED_OLLAMA_MODEL) throw new Error(`OLLAMA_MODEL deve ser ${REQUIRED_OLLAMA_MODEL}.`);
  const url = new URL(env.OLLAMA_BASE_URL?.trim() || "http://127.0.0.1:11434");
  if (url.protocol !== "http:" || !["localhost", "127.0.0.1", "[::1]", "host.docker.internal", "ollama"].includes(url.hostname) || url.username || url.password || url.search || url.hash || url.pathname !== "/") {
    throw new Error("OLLAMA_BASE_URL deve ser um endereço HTTP local, sem caminho ou credenciais.");
  }
  return { baseUrl: url.origin, model };
}

export function ollamaInferenceConfig(env: NodeJS.ProcessEnv = process.env) {
  const positiveInteger = (name: string, fallback: number, maximum: number): number => {
    const value = env[name] === undefined ? fallback : Number(env[name]);
    if (!Number.isSafeInteger(value) || value < 1 || value > maximum) throw new Error(`${name} deve ser um inteiro entre 1 e ${maximum}.`);
    return value;
  };
  return { ...ollamaConfig(env), context: positiveInteger("OLLAMA_CONTEXT", 4096, 131072), concurrency: positiveInteger("OLLAMA_CONCURRENCY", 1, 16), timeoutMs: positiveInteger("OLLAMA_TIMEOUT_MS", 120000, 3600000) };
}
