import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ollamaInferenceConfig } from "../../../../infra/ollama/OllamaConfig";
import { ExtractionError, type ExtractionSuggestion, type ResumeExtractionProvider } from "../../application/providers/ResumeExtractionProvider";
import { validateExtraction } from "../../application/use-cases/ValidateExtraction";

const schema = { type: "object", additionalProperties: false, required: ["fullName", "email", "phone"], properties: { fullName: { type: ["string", "null"] }, email: { type: ["string", "null"] }, phone: { type: ["string", "null"] } } };
const promptVersion = "ExtractResumeV1";
export function mapExtractionFailure(error: unknown): ExtractionError {
  if (error instanceof ExtractionError) return error;
  if (typeof error === "object" && error !== null && "name" in error && (error.name === "TimeoutError" || error.name === "AbortError")) return new ExtractionError("TIMEOUT", "A extração excedeu o tempo limite. Preencha manualmente ou tente novamente.");
  return new ExtractionError("UNAVAILABLE", "O serviço de extração está indisponível. Preencha manualmente.");
}
export class OllamaResumeExtractionProvider implements ResumeExtractionProvider {
  private active = 0;
  constructor(private readonly config = ollamaInferenceConfig()) {}
  async extract(images: readonly Uint8Array[]): Promise<ExtractionSuggestion> {
    if (!images.length || images.some((image) => !(image instanceof Uint8Array) || image.byteLength === 0)) throw new ExtractionError("INVALID_INPUT", "Forneça imagens válidas do currículo.");
    if (this.active >= this.config.concurrency) throw new ExtractionError("BUSY", "A extração está ocupada. Tente novamente ou preencha manualmente.");
    this.active++;
    try {
      const prompt = readFileSync(join(__dirname, "../prompts/ExtractResumeV1.md"), "utf8");
      const response = await fetch(`${this.config.baseUrl}/api/generate`, {
        method: "POST", headers: { "content-type": "application/json" }, signal: AbortSignal.timeout(this.config.timeoutMs),
        body: JSON.stringify({ model: this.config.model, system: prompt, prompt, images: images.map((image) => Buffer.from(image).toString("base64")), format: schema, stream: false, options: { num_ctx: this.config.context, temperature: 0 } }),
      });
      if (!response.ok) throw new ExtractionError("UNAVAILABLE", "O serviço de extração está indisponível. Preencha manualmente.");
      let envelope: { model?: unknown; response?: unknown; done?: unknown };
      try { envelope = await response.json() as typeof envelope; } catch (error) { if (mapExtractionFailure(error).code === "TIMEOUT") throw error; throw new ExtractionError("INVALID_RESPONSE", "A resposta da extração é inválida. Preencha os dados manualmente."); }
      if (!envelope || envelope.model !== this.config.model || envelope.done !== true || typeof envelope.response !== "string") throw new ExtractionError("INVALID_RESPONSE", "A resposta da extração é inválida. Preencha os dados manualmente.");
      let raw: unknown;
      try { raw = JSON.parse(envelope.response); } catch { throw new ExtractionError("INVALID_RESPONSE", "A resposta da extração é inválida. Preencha os dados manualmente."); }
      return { fields: validateExtraction(raw), requiresReview: true, model: this.config.model, promptVersion };
    } catch (error) {
      throw mapExtractionFailure(error);
    } finally { this.active--; }
  }
}
