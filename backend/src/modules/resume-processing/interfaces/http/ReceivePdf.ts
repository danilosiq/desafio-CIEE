import type { RequestHandler } from "express";
import multer from "multer";

const maxPdfSize = 5 * 1024 * 1024;
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: maxPdfSize + 1, files: 1, fields: 0, parts: 2 } }).single("file");
function receiver(scan: boolean): RequestHandler {
  return (req, res, next) => {
    const fail = (status: number, code: string, message: string) => { res.status(status).json(scan ? { error: { code, message } } : { code, message }); };
    if (!req.is("multipart/form-data")) { fail(415, scan ? "INVALID_PDF_TYPE" : "INVALID_CONTENT_TYPE", "Envie um PDF como multipart/form-data no campo file."); return; }
    upload(req, res, (error: unknown) => {
      if (error) {
        if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") { fail(413, scan ? "FILE_TOO_LARGE" : "PDF_TOO_LARGE", "O PDF deve ter no máximo 5 MB."); return; }
        fail(400, "INVALID_UPLOAD", "Envie um único arquivo no campo file."); return;
      }
      const file = req.file;
      if (!file) { fail(400, scan ? "FILE_REQUIRED" : "MISSING_FILE", "Selecione um PDF. Você também pode cadastrar manualmente."); return; }
      if (file.size > maxPdfSize) { fail(413, scan ? "FILE_TOO_LARGE" : "PDF_TOO_LARGE", "O PDF deve ter no máximo 5 MB."); return; }
      if (scan && (!/\.pdf$/i.test(file.originalname) || file.mimetype !== "application/pdf" || !file.buffer.subarray(0, 1024).includes(Buffer.from("%PDF-")))) {
        fail(415, "INVALID_PDF_TYPE", "O arquivo deve ser um PDF válido."); return;
      }
      next();
    });
  };
}
export const receivePdf = receiver(false);
export const receiveScanPdf = receiver(true);
