import type { PdfTextReader } from "../providers/PdfTextReader";
import { extractFields, type ExtractionResult } from "../extraction/ExtractFields";
export class ExtractResumeText {
  constructor(private readonly reader: PdfTextReader) {}
  async execute(pdf: Uint8Array): Promise<ExtractionResult> {
    return extractFields(await this.reader.parse(pdf));
  }
}
