export type RenderedPage = { page: number; width: number; height: number; image: Buffer };
export interface PdfRenderer { render(pdf: Uint8Array): Promise<RenderedPage[]>; }
export class PdfError extends Error {
  constructor(readonly code: "INVALID_PDF" | "PASSWORD_PROTECTED" | "RENDER_FAILED", message: string) { super(message); this.name = "PdfError"; }
}
