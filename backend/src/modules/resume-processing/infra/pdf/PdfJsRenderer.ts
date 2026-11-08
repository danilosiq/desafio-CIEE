import { createCanvas, type Canvas } from "@napi-rs/canvas";
import { PdfError, type PdfRenderer, type RenderedPage } from "../../application/providers/PdfRenderer";

type PdfJs = typeof import("pdfjs-dist/legacy/build/pdf.mjs");
const loadPdfJs = new Function("return import('pdfjs-dist/legacy/build/pdf.mjs')") as () => Promise<PdfJs>;

export class PdfJsRenderer implements PdfRenderer {
  constructor(private readonly scale = 1.5, private readonly maxPixels = 16000000) {
    if (!Number.isFinite(scale) || scale <= 0 || scale > 4) throw new Error("PDF_RENDER_SCALE deve estar entre 0 e 4.");
    if (!Number.isSafeInteger(maxPixels) || maxPixels < 1 || maxPixels > 100000000) throw new Error("PDF_RENDER_MAX_PIXELS deve estar entre 1 e 100000000.");
  }
  async render(pdf: Uint8Array): Promise<RenderedPage[]> {
    if (!Buffer.from(pdf.subarray(0, 1024)).includes(Buffer.from("%PDF-"))) throw new PdfError("INVALID_PDF", "O arquivo não é um PDF válido.");
    const pdfjs = await loadPdfJs();
    const task = pdfjs.getDocument({ data: new Uint8Array(pdf), useSystemFonts: true, stopAtErrors: true, verbosity: 0 });
    let document: Awaited<typeof task.promise> | undefined;
    try {
      try { document = await task.promise; }
      catch (error) {
        if (error instanceof Error && error.name === "PasswordException") throw new PdfError("PASSWORD_PROTECTED", "PDF protegido por senha não é aceito.");
        throw new PdfError("INVALID_PDF", "O PDF está inválido ou corrompido.");
      }
      if (document.numPages < 1) throw new PdfError("INVALID_PDF", "O PDF não contém páginas.");
      const pages: RenderedPage[] = [];
      for (let number = 1; number <= document.numPages; number++) {
        const page = await document.getPage(number);
        let canvas: Canvas | undefined;
        try {
          const original = page.getViewport({ scale: this.scale });
          if (!Number.isFinite(original.width) || !Number.isFinite(original.height) || original.width <= 0 || original.height <= 0) throw new Error("Dimensões de página inválidas.");
          const factor = Math.min(1, Math.sqrt(this.maxPixels / (Math.ceil(original.width) * Math.ceil(original.height))), this.maxPixels / Math.ceil(original.width), this.maxPixels / Math.ceil(original.height));
          const viewport = factor < 1 ? page.getViewport({ scale: this.scale * factor }) : original;
          const width = Math.max(1, Math.floor(viewport.width));
          const height = Math.max(1, Math.floor(viewport.height));
          canvas = createCanvas(width, height);
          await page.render({ canvas: canvas as unknown as HTMLCanvasElement, canvasContext: canvas.getContext("2d") as unknown as CanvasRenderingContext2D, viewport }).promise;
          pages.push({ page: number, width: canvas.width, height: canvas.height, image: canvas.toBuffer("image/png") });
        } finally { try { page.cleanup(); } finally { if (canvas) { canvas.width = 0; canvas.height = 0; } } }
      }
      return pages;
    } catch (error) {
      if (error instanceof PdfError) throw error;
      throw new PdfError("RENDER_FAILED", "Não foi possível renderizar todas as páginas do PDF.");
    } finally { await task.destroy(); }
  }
}
