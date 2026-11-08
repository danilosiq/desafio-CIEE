import { Router } from "express";
import { PdfTextError } from "../../application/extraction/PdfTextError";
import { createTextExtraction } from "../../infra/pdf/CreateTextExtraction";
import { receiveScanPdf } from "./ReceivePdf";

export function createScanRoutes(): Router {
  const router = Router();
  router.post("/scan", receiveScanPdf, (req, res) => {
    const started = Date.now();
    void Promise.resolve().then(() => createTextExtraction().execute(req.file!.buffer)).then((result) => {
      console.info(`PDF extraction status=${result.extraction.status} durationMs=${Date.now() - started}`);
      res.json(result);
    }).catch((reason: unknown) => {
      const error = reason instanceof PdfTextError ? reason : new PdfTextError("EXTRACTION_FAILED", "Ocorreu uma falha na leitura. Você ainda pode cadastrar manualmente.");
      const status = error.code === "EXTRACTION_BUSY" ? 503 : error.code === "EXTRACTION_TIMEOUT" ? 504 : error.code === "EXTRACTION_FAILED" ? 500 : 422;
      console.info(`PDF extraction status=${error.code} durationMs=${Date.now() - started}`);
      res.status(status).json({ error: { code: error.code, message: error.message } });
    });
  });
  return router;
}
