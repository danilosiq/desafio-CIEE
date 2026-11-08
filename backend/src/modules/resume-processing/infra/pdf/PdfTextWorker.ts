import { parentPort, workerData } from "node:worker_threads";
import { PDFParse } from "pdf-parse";

const port = parentPort;
const input = workerData as { pdf: Uint8Array; maxPages: number };
async function run(): Promise<void> {
  const parser = new PDFParse({ data: new Uint8Array(input.pdf), useSystemFonts: true, isEvalSupported: false, stopAtErrors: true, verbosity: 0 });
  let output: { code: string } | { text: string } = { code: "PDF_UNREADABLE" };
  try {
    const info = await parser.getInfo();
    if (!Number.isSafeInteger(info.total) || info.total < 1) output = { code: "PDF_UNREADABLE" };
    else if (info.total > input.maxPages) output = { code: "PDF_TOO_MANY_PAGES" };
    else {
      const result = await parser.getText();
      if (result.pages.length !== info.total || result.pages.some((page, index) => page.num !== index + 1)) output = { code: "PDF_UNREADABLE" };
      else {
        const text = result.pages.map((page) => page.text).join("\n");
        output = text.trim() ? { text } : { code: "NO_EXTRACTABLE_TEXT" };
      }
    }
  } catch { output = { code: "PDF_UNREADABLE" }; }
  finally { await parser.destroy().catch(() => undefined); }
  port?.postMessage(output);
}
void run();
