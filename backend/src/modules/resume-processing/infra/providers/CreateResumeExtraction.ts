import { ExtractResume } from "../../application/use-cases/ExtractResume";
import { OllamaResumeExtractionProvider } from "./OllamaResumeExtractionProvider";

let provider: OllamaResumeExtractionProvider | undefined;
export function getResumeExtractionProvider(): OllamaResumeExtractionProvider {
  return provider ??= new OllamaResumeExtractionProvider();
}
let instance: ExtractResume | undefined;
export function createResumeExtraction(): ExtractResume {
  return instance ??= new ExtractResume(getResumeExtractionProvider());
}
