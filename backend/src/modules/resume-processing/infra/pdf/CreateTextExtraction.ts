import { ExtractResumeText } from "../../application/use-cases/ExtractResumeText";
import { PdfTextParser } from "./PdfTextParser";
let instance: ExtractResumeText | undefined;
export function createTextExtraction(): ExtractResumeText {
  return instance ??= new ExtractResumeText(new PdfTextParser());
}
