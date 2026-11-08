import express from "express";
import request from "supertest";
import { createScanRoutes } from "../../src/modules/resume-processing/interfaces/http/ScanRoutes";
import { openApi } from "../../src/infra/http/documentation/OpenApi";
import { makePdf } from "../fixtures/MakePdf";
const app = express(); app.use(createScanRoutes());
jest.setTimeout(30000);
it("rejeita conteúdo inválido antes da extração", async () => {
  const response = await request(app).post("/scan").attach("file", Buffer.from("não é PDF"), "arquivo.pdf").expect(415);
  expect(response.body.error.code).toBe("INVALID_PDF_TYPE");
});
it("orienta preenchimento manual para PDF sem texto selecionável", async () => {
  const response = await request(app).post("/scan").attach("file", makePdf(), "curriculo.pdf").expect(422);
  expect(response.body.error).toMatchObject({ code: "NO_EXTRACTABLE_TEXT", message: expect.stringContaining("manualmente") });
});
it("rejeita arquivo acima de 5 MiB e descreve contrato no Swagger", async () => {
  await request(app).post("/scan").attach("file", Buffer.alloc(5 * 1024 * 1024 + 1), "grande.pdf").expect(413);
  expect(openApi.paths["/scan"].post.requestBody.content["multipart/form-data"].schema.properties.file.format).toBe("binary");
  expect(openApi.paths["/scan"].post.responses["504"]).toBeDefined();
});
