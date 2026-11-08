import { ScanPdf } from "../../application/use-cases/ScanPdf";
import { createPdfRenderer } from "../pdf/CreatePdfRenderer";
import { getResumeExtractionProvider } from "./CreateResumeExtraction";
export function createScanPdf(): ScanPdf {
  return new ScanPdf(createPdfRenderer(), getResumeExtractionProvider());
}
