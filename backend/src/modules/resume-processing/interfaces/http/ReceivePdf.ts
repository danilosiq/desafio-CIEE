import type { RequestHandler } from "express";
import multer from "multer";

const maxPdfSize = 5 * 1024 * 1024;
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: maxPdfSize + 1, files: 1, fields: 0, parts: 2 } }).single("file");
export const receivePdf: RequestHandler = (req, res, next) => {
  if (!req.is("multipart/form-data")) { res.status(415).json({ code: "INVALID_CONTENT_TYPE", message: "Envie um PDF como multipart/form-data no campo file." }); return; }
  upload(req, res, (error: unknown) => {
    if (error) {
      if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") { res.status(413).json({ code: "PDF_TOO_LARGE", message: "O PDF deve ter no máximo 5 MB." }); return; }
      res.status(400).json({ code: "INVALID_UPLOAD", message: "Envie um único arquivo no campo file." }); return;
    }
    if (!req.file) { res.status(400).json({ code: "MISSING_FILE", message: "Envie um PDF no campo file." }); return; }
    if (req.file.size > maxPdfSize) { res.status(413).json({ code: "PDF_TOO_LARGE", message: "O PDF deve ter no máximo 5 MB." }); return; }
    next();
  });
};
