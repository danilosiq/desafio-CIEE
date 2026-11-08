import { PdfJsRenderer } from "./PdfJsRenderer";
export function createPdfRenderer(): PdfJsRenderer {
  return new PdfJsRenderer(Number(process.env.PDF_RENDER_SCALE ?? "1.5"), Number(process.env.PDF_RENDER_MAX_PIXELS ?? "16000000"));
}
