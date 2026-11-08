import { PdfTextParser } from "../../src/modules/resume-processing/infra/pdf/PdfTextParser";
import { makePdf } from "../fixtures/MakePdf";
import { makeTextPdf } from "../fixtures/MakeTextPdf";

jest.setTimeout(30000);
it("rejeita explicitamente quantidade de páginas acima do limite sem truncar", async () => {
  const parser = new PdfTextParser({ maxPages: 1, timeoutMs: 10000, concurrency: 1 });
  await expect(parser.parse(makePdf())).rejects.toMatchObject({ code: "PDF_TOO_MANY_PAGES" });
});
it("encerra leitura que ultrapassa tempo limite e libera a vaga de execução", async () => {
  const parser = new PdfTextParser({ maxPages: 20, timeoutMs: 1, concurrency: 1 });
  const pdf = makeTextPdf(["Ana Silva"]);
  await expect(parser.parse(pdf)).rejects.toMatchObject({ code: "EXTRACTION_TIMEOUT" });
  await expect(parser.parse(pdf)).rejects.toMatchObject({ code: "EXTRACTION_TIMEOUT" });
});
it("limita concorrência sem recusar trabalhos posteriores", async () => {
  const parser = new PdfTextParser({ maxPages: 20, timeoutMs: 10000, concurrency: 1 });
  const pdf = makeTextPdf(["Ana Silva", "ana@example.com"]);
  const first = parser.parse(pdf);
  await expect(parser.parse(pdf)).rejects.toMatchObject({ code: "EXTRACTION_BUSY" });
  expect(await first).toContain("ana@example.com");
  expect(await parser.parse(pdf)).toContain("Ana Silva");
});
