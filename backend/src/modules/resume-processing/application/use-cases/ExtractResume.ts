import type { ResumeExtractionProvider, ExtractionSuggestion } from "../providers/ResumeExtractionProvider";

export class ExtractResume {
  constructor(private readonly provider: ResumeExtractionProvider) {}
  execute(images: readonly Uint8Array[]): Promise<ExtractionSuggestion> {
    return this.provider.extract(images);
  }
}
