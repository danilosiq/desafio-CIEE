export type ExtractedResumeFields = { fullName: string | null; email: string | null; phone: string | null };
export type ExtractionSuggestion = { fields: ExtractedResumeFields; requiresReview: true; model: string; promptVersion: string };
export interface ResumeExtractionProvider {
  extract(images: readonly Uint8Array[]): Promise<ExtractionSuggestion>;
}
export class ExtractionError extends Error {
  constructor(readonly code: "INVALID_RESPONSE" | "UNAVAILABLE" | "TIMEOUT" | "BUSY" | "INVALID_INPUT", message: string) {
    super(message);
    this.name = "ExtractionError";
  }
}
