export type PdfTextErrorCode = "PDF_UNREADABLE" | "NO_EXTRACTABLE_TEXT" | "PDF_TOO_MANY_PAGES" | "EXTRACTION_TIMEOUT" | "EXTRACTION_BUSY" | "EXTRACTION_FAILED";
export class PdfTextError extends Error {
  constructor(readonly code: PdfTextErrorCode, message: string) { super(message); this.name = "PdfTextError"; }
}
