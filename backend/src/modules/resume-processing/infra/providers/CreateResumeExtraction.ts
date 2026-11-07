import { ExtractResume } from "../../application/use-cases/ExtractResume";
import { OllamaResumeExtractionProvider } from "./OllamaResumeExtractionProvider";

let instance: ExtractResume | undefined;
export function createResumeExtraction(): ExtractResume {
  return instance ??= new ExtractResume(new OllamaResumeExtractionProvider());
}
