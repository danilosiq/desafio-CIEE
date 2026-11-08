import { Router } from "express";
import { PdfError } from "../../application/providers/PdfRenderer";
import { createPdfRenderer } from "../../infra/pdf/CreatePdfRenderer";
import { receivePdf } from "./ReceivePdf";

export function createPdfRoutes(): Router {
  const router = Router();
  router.post("/render", receivePdf, (req, res, next) => {
    void Promise.resolve().then(() => createPdfRenderer().render(req.file!.buffer)).then((pages) => {
      res.json({ pages: pages.map(({ page, width, height, image }) => ({ page, width, height, mimeType: "image/png", imageBase64: image.toString("base64") })) });
    }).catch((reason: unknown) => {
      if (reason instanceof PdfError) { res.status(reason.code === "RENDER_FAILED" ? 422 : 400).json({ code: reason.code, message: reason.message }); return; }
      next(reason);
    });
  });
  return router;
}
