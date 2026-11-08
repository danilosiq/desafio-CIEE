import type { PdfRenderer } from "../providers/PdfRenderer";
import type { ExtractionSuggestion, ResumeExtractionProvider } from "../providers/ResumeExtractionProvider";
import { consolidateExtractions, type ScanResult } from "./ConsolidateExtractions";

export class ScanPdf {
  constructor(private readonly renderer: PdfRenderer, private readonly extractor: ResumeExtractionProvider) {}
  async execute(pdf: Uint8Array): Promise<ScanResult> {
    const pages = await this.renderer.render(pdf);
    const results: ExtractionSuggestion[] = [];
    try {
      if (!pages.length || pages.some((page, index) => page.page !== index + 1)) throw new Error("As páginas do PDF não foram processadas em ordem.");
      for (const page of pages) {
        results.push(await this.extractor.extract([page.image]));
        page.image = Buffer.alloc(0);
      }
      return consolidateExtractions(results);
    } finally {
      for (const page of pages) page.image = Buffer.alloc(0);
    }
  }
}
