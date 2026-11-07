import { Router } from "express";
import multer from "multer";
import { PdfError } from "../../application/providers/PdfRenderer";
import { PdfJsRenderer } from "../../infra/pdf/PdfJsRenderer";

const maxPdfSize = 5 * 1024 * 1024;
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: maxPdfSize + 1, files: 1, fields: 0, parts: 2 } }).single("file");
export function createPdfRoutes(): Router {
  const router = Router();
  router.post("/render", (req, res, next) => {
    if (!req.is("multipart/form-data")) { res.status(415).json({ code: "INVALID_CONTENT_TYPE", message: "Envie um PDF como multipart/form-data no campo file." }); return; }
    upload(req, res, (error: unknown) => {
      if (error) {
        if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") { res.status(413).json({ code: "PDF_TOO_LARGE", message: "O PDF deve ter no máximo 5 MB." }); return; }
        res.status(400).json({ code: "INVALID_UPLOAD", message: "Envie um único arquivo no campo file." }); return;
      }
      const file = req.file;
      if (!file) { res.status(400).json({ code: "MISSING_FILE", message: "Envie um PDF no campo file." }); return; }
      if (file.size > maxPdfSize) { res.status(413).json({ code: "PDF_TOO_LARGE", message: "O PDF deve ter no máximo 5 MB." }); return; }
      const scale = Number(process.env.PDF_RENDER_SCALE ?? "1.5");
      const maxPixels = Number(process.env.PDF_RENDER_MAX_PIXELS ?? "16000000");
      void Promise.resolve().then(() => new PdfJsRenderer(scale, maxPixels).render(file.buffer)).then((pages) => {
        res.json({ pages: pages.map(({ page, width, height, image }) => ({ page, width, height, mimeType: "image/png", imageBase64: image.toString("base64") })) });
      }).catch((reason: unknown) => {
        if (reason instanceof PdfError) { res.status(reason.code === "RENDER_FAILED" ? 422 : 400).json({ code: reason.code, message: reason.message }); return; }
        next(reason);
      });
    });
  });
  return router;
}
