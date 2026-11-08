import { Router } from "express";
import { PdfError } from "../../application/providers/PdfRenderer";
import { ExtractionError } from "../../application/providers/ResumeExtractionProvider";
import { createScanPdf } from "../../infra/providers/CreateScanPdf";
import { receivePdf } from "./ReceivePdf";

export function createScanRoutes(): Router {
  const router = Router();
  router.post("/scan", receivePdf, (req, res, next) => {
    void Promise.resolve().then(() => createScanPdf().execute(req.file!.buffer)).then((result) => res.json(result)).catch((error: unknown) => {
      if (error instanceof PdfError) { res.status(error.code === "RENDER_FAILED" ? 422 : 400).json({ code: error.code, message: error.message }); return; }
      if (error instanceof ExtractionError) {
        const status = error.code === "TIMEOUT" ? 504 : error.code === "INVALID_RESPONSE" ? 502 : error.code === "INVALID_INPUT" ? 400 : 503;
        res.status(status).json({ code: error.code, message: error.message }); return;
      }
      next(error);
    });
  });
  return router;
}
