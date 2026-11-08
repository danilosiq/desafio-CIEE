import express from "express";
import request from "supertest";
import { createScanRoutes } from "../../src/modules/resume-processing/interfaces/http/ScanRoutes";
import { openApi } from "../../src/infra/http/documentation/OpenApi";
import { makePdf } from "../fixtures/MakePdf";

const app = express();
app.use(createScanRoutes());
beforeAll(() => { process.env.OLLAMA_BASE_URL = "http://127.0.0.1:1"; });
afterAll(() => { delete process.env.OLLAMA_BASE_URL; });
it("rejeita conteúdo inválido antes da inferência", async () => {
  const response = await request(app).post("/scan").attach("file", Buffer.from("não é PDF"), "arquivo.pdf").expect(400);
  expect(response.body.code).toBe("INVALID_PDF");
});
it("devolve erro claro quando a inferência real está indisponível", async () => {
  const response = await request(app).post("/scan").attach("file", makePdf(), "curriculo.pdf").expect(503);
  expect(response.body).toMatchObject({ code: "UNAVAILABLE", message: expect.stringContaining("manualmente") });
});
it("rejeita arquivo acima de 5 MiB e descreve o contrato no Swagger", async () => {
  await request(app).post("/scan").attach("file", Buffer.alloc(5 * 1024 * 1024 + 1), "grande.pdf").expect(413);
  expect(openApi.paths["/scan"].post.requestBody.content["multipart/form-data"].schema.properties.file.format).toBe("binary");
  expect(openApi.paths["/scan"].post.responses["504"]).toBeDefined();
});
