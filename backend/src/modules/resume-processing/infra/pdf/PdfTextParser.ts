import { existsSync } from "node:fs";
import { join } from "node:path";
import { Worker } from "node:worker_threads";
import type { PdfTextReader } from "../../application/providers/PdfTextReader";
import { PdfTextError, type PdfTextErrorCode } from "../../application/extraction/PdfTextError";

type Options = { maxPages: number; timeoutMs: number; concurrency: number };
function integer(name: string, fallback: number, max: number): number {
  const value = process.env[name] === undefined ? fallback : Number(process.env[name]);
  if (!Number.isSafeInteger(value) || value < 1 || value > max) throw new Error(`Configuração inválida: ${name}.`);
  return value;
}
export function pdfTextOptions(): Options {
  return { maxPages: integer("PDF_MAX_PAGES", 20, 10000), timeoutMs: integer("PDF_PARSE_TIMEOUT_MS", 15000, 3600000), concurrency: integer("PDF_PARSE_CONCURRENCY", 2, 100) };
}
const messages: Record<PdfTextErrorCode, string> = {
  PDF_UNREADABLE: "Não foi possível ler este PDF. Preencha o formulário manualmente.",
  NO_EXTRACTABLE_TEXT: "O PDF não contém texto selecionável. Preencha o formulário manualmente.",
  PDF_TOO_MANY_PAGES: "O PDF excede o limite de páginas permitido. Preencha o formulário manualmente.",
  EXTRACTION_TIMEOUT: "A leitura excedeu o tempo limite. Preencha o formulário manualmente.",
  EXTRACTION_BUSY: "A leitura está ocupada. Tente novamente ou preencha manualmente.",
  EXTRACTION_FAILED: "Ocorreu uma falha na leitura. Você ainda pode cadastrar manualmente.",
};
export class PdfTextParser implements PdfTextReader {
  private active = 0;
  constructor(private readonly options: Options = pdfTextOptions()) {}
  async parse(pdf: Uint8Array): Promise<string> {
    if (this.active >= this.options.concurrency) throw new PdfTextError("EXTRACTION_BUSY", messages.EXTRACTION_BUSY);
    this.active++;
    let worker: Worker | undefined;
    try {
      const compiled = join(__dirname, "PdfTextWorker.js");
      const file = existsSync(compiled) ? compiled : join(__dirname, "PdfTextWorker.ts");
      worker = new Worker(file, { workerData: { pdf, maxPages: this.options.maxPages }, execArgv: [] });
      return await new Promise<string>((resolve, reject) => {
        let settled = false;
        const finish = (fn: () => void) => { if (!settled) { settled = true; clearTimeout(timer); fn(); } };
        const timer = setTimeout(() => finish(() => reject(new PdfTextError("EXTRACTION_TIMEOUT", messages.EXTRACTION_TIMEOUT))), this.options.timeoutMs);
        worker!.once("message", (result: { text?: unknown; code?: PdfTextErrorCode }) => finish(() => {
          if (typeof result.text === "string") resolve(result.text);
          else { const code = result.code && Object.hasOwn(messages, result.code) ? result.code : "EXTRACTION_FAILED"; reject(new PdfTextError(code, messages[code])); }
        }));
        worker!.once("error", () => finish(() => reject(new PdfTextError("EXTRACTION_FAILED", messages.EXTRACTION_FAILED))));
        worker!.once("exit", () => finish(() => reject(new PdfTextError("EXTRACTION_FAILED", messages.EXTRACTION_FAILED))));
      });
    } finally { try { if (worker) await worker.terminate(); } finally { this.active--; } }
  }
}
