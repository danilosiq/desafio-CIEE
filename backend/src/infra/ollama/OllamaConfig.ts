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
