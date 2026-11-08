import express from "express";
import request from "supertest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createScanRoutes } from "../../src/modules/resume-processing/interfaces/http/ScanRoutes";
import { makeTextPdf } from "../fixtures/MakeTextPdf";
import { makePdf } from "../fixtures/MakePdf";

jest.setTimeout(30000);
const app = express(); app.use(createScanRoutes());
it("recebe PDF textual e sugere dados sem acessar IA ou banco", async () => {
  const pdf = makeTextPdf(["CURRICULO", "Ana Maria Silva", "ana@example.com", "Telefone: (11) 99999-0000"]);
  const response = await request(app).post("/scan").attach("file", pdf, { filename: "ficticio.pdf", contentType: "application/pdf" }).expect(200);
  expect(response.body).toMatchObject({ data: { name: "Ana Maria Silva", email: "ana@example.com", phone: "(11) 99999-0000" }, extraction: { status: "success", method: "text-rules" } });
});
it("retorna parcial quando não há telefone", async () => {
  const pdf = makeTextPdf(["Ana Maria Silva", "ana@example.com"]);
  const response = await request(app).post("/scan").attach("file", pdf, { filename: "ficticio.pdf", contentType: "application/pdf" }).expect(200);
  expect(response.body).toMatchObject({ data: { name: "Ana Maria Silva", email: "ana@example.com", phone: null }, extraction: { status: "partial" } });
});
it("recusa PDF sem texto, corrompido e protegido sem expor detalhes", async () => {
  await request(app).post("/scan").attach("file", makePdf(), "vazio.pdf").expect(422).expect(({ body }) => expect(body.error.code).toBe("NO_EXTRACTABLE_TEXT"));
  await request(app).post("/scan").attach("file", Buffer.from("%PDF-1.7\ncorrompido"), "falso.pdf").expect(422).expect(({ body }) => expect(body.error.code).toBe("PDF_UNREADABLE"));
  await request(app).post("/scan").attach("file", readFileSync(join(__dirname, "../fixtures/Protected.pdf")), "protegido.pdf").expect(422).expect(({ body }) => expect(body.error.code).toBe("PDF_UNREADABLE"));
});
it("valida arquivo único, tipo, assinatura e limite no recebimento", async () => {
  await request(app).post("/scan").set("Content-Type", "multipart/form-data; boundary=empty").send("--empty--\r\n").expect(400).expect(({ body }) => expect(body.error.code).toBe("FILE_REQUIRED"));
  await request(app).post("/scan").attach("file", Buffer.from("PNG"), { filename: "falso.pdf", contentType: "application/pdf" }).expect(415).expect(({ body }) => expect(body.error.code).toBe("INVALID_PDF_TYPE"));
  await request(app).post("/scan").attach("file", makeTextPdf(["Ana Silva"]), { filename: "x.txt", contentType: "text/plain" }).expect(415).expect(({ body }) => expect(body.error.code).toBe("INVALID_PDF_TYPE"));
  await request(app).post("/scan").attach("file", Buffer.alloc(5 * 1024 * 1024 + 1), "grande.pdf").expect(413).expect(({ body }) => expect(body.error.code).toBe("FILE_TOO_LARGE"));
  const source = makeTextPdf(["Ana Silva", "ana@example.com"]); const exact = Buffer.concat([source, Buffer.alloc(5 * 1024 * 1024 - source.length, 32)]);
  await request(app).post("/scan").attach("file", exact, { filename: "max.pdf", contentType: "application/pdf" }).expect(200);
});
