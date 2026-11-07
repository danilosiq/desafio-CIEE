import { readFileSync } from "node:fs";
import { join } from "node:path";
import request from "supertest";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import express from "express";
import { createPdfRoutes } from "../../src/modules/resume-processing/interfaces/http/PdfRoutes";
import { openApi } from "../../src/infra/http/documentation/OpenApi";
import { PdfJsRenderer } from "../../src/modules/resume-processing/infra/pdf/PdfJsRenderer";
import { makePdf, makeScannedPdf } from "../fixtures/MakePdf";

const app = express();
app.use("/pdf", createPdfRoutes());
const max = 5 * 1024 * 1024;

it("renderiza todas as páginas em ordem, com conteúdo visual distinto", async () => {
  const pages = await new PdfJsRenderer(1).render(makePdf());
  expect(pages.map((p) => [p.page, p.width, p.height])).toEqual([[1, 100, 80], [2, 100, 80]]);
  const colors = await Promise.all(pages.map(async (page) => {
    const canvas = createCanvas(1, 1);
    canvas.getContext("2d").drawImage(await loadImage(page.image), 0, 0, 1, 1);
    return [...canvas.getContext("2d").getImageData(0, 0, 1, 1).data];
  }));
  expect(colors).toEqual([[255, 0, 0, 255], [0, 0, 255, 255]]);
});
it("renderiza PDF digitalizado com imagem incorporada", async () => {
  const source = createCanvas(100, 80);
  const context = source.getContext("2d");
  context.fillStyle = "#ffffff"; context.fillRect(0, 0, 100, 80);
  context.fillStyle = "#000000"; context.fillRect(10, 10, 30, 30);
  const pdf = makeScannedPdf(source.toBuffer("image/jpeg"));
  const result = await request(app).post("/pdf/render").attach("file", pdf, "digitalizado.pdf").expect(200);
  const image = await loadImage(Buffer.from(result.body.pages[0].imageBase64, "base64"));
  const canvas = createCanvas(image.width, image.height);
  const rendered = canvas.getContext("2d"); rendered.drawImage(image, 0, 0);
  expect(rendered.getImageData(30, 30, 1, 1).data[0]).toBeLessThan(50);
  expect(rendered.getImageData(120, 90, 1, 1).data[0]).toBeGreaterThan(200);
});
it("ajusta a resolução de páginas grandes sem descartá-las", async () => {
  const pages = await new PdfJsRenderer(1, 2000).render(makePdf());
  expect(pages).toHaveLength(2);
  expect(pages.every((page) => page.width * page.height <= 2000)).toBe(true);
});
it("aceita PDF exatamente no limite e rejeita um byte a mais", async () => {
  const pdf = makePdf();
  const exact = Buffer.concat([pdf, Buffer.alloc(max - pdf.length, 0x20)]);
  const accepted = await request(app).post("/pdf/render").attach("file", exact, { filename: "x.pdf", contentType: "application/pdf" }).expect(200);
  expect(accepted.body.pages.map((page: { page: number }) => page.page)).toEqual([1, 2]);
  await request(app).post("/pdf/render").attach("file", Buffer.concat([exact, Buffer.from(" ")]), "x.pdf").expect(413);
});
it("rejeita arquivo renomeado, PDF corrompido e PDF protegido por senha", async () => {
  await request(app).post("/pdf/render").attach("file", Buffer.from("não é PDF"), "falso.pdf").expect(400).expect(({body}) => expect(body.code).toBe("INVALID_PDF"));
  await request(app).post("/pdf/render").attach("file", Buffer.from("%PDF-1.7\ncorrompido"), "x.pdf").expect(400).expect(({body}) => expect(body.code).toBe("INVALID_PDF"));
  await request(app).post("/pdf/render").attach("file", readFileSync(join(__dirname, "../fixtures/Protected.pdf")), "x.pdf").expect(400).expect(({body}) => expect(body.code).toBe("PASSWORD_PROTECTED"));
  const recovered = await request(app).post("/pdf/render").attach("file", makePdf(), "valido.pdf").expect(200);
  expect(recovered.body.pages).toHaveLength(2);
});
it("documenta o multipart e as respostas de erro", async () => {
  expect(openApi.paths["/pdf/render"].post.requestBody.content["multipart/form-data"].schema.properties.file.format).toBe("binary");
  await request(app).post("/pdf/render").send({}).expect(415);
  await request(app).post("/pdf/render").set("Content-Type", "multipart/form-data; boundary=empty").send("--empty--\r\n").expect(400);
});
