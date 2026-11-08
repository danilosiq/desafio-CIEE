import request from "supertest";
import { createApp } from "../../src/main/App";
import { DuplicateEmailError } from "../../src/modules/resumes/domain/DuplicateEmailError";
import { ResumeNotFoundError } from "../../src/modules/resumes/domain/ResumeNotFoundError";

const sample = {
  id: "11111111-1111-4111-8111-111111111111",
  fullName: "Pessoa Fictícia",
  email: "pessoa@example.com",
  phone: "11900000000",
  areaOfExpertise: "TI",
  professionalSummary: "Resumo",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

function makeApp(overrides: Partial<Record<string, jest.Mock>> = {}) {
  const repository = {
    list: jest.fn().mockResolvedValue({ items: [], total: 0 }),
    create: jest.fn().mockResolvedValue(sample),
    findById: jest.fn().mockResolvedValue(sample),
    findByEmail: jest.fn(),
    update: jest.fn().mockResolvedValue({ ...sample, fullName: "Atualizado" }),
    delete: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
  return { app: createApp(repository as any), repository };
}

const validBody = {
  fullName: "Pessoa Fictícia",
  email: "PESSOA@example.com",
  phone: "11900000000",
  areaOfExpertise: "TI",
  professionalSummary: "Resumo",
};

it("CA-01: cadastro manual válido persiste os cinco campos e não exige arquivo", async () => {
  const { app, repository } = makeApp();
  const response = await request(app).post("/resumes").send(validBody).expect(201);
  expect(response.body).toMatchObject({ id: sample.id, fullName: "Pessoa Fictícia" });
  expect(repository.create).toHaveBeenCalledWith({
    fullName: "Pessoa Fictícia",
    email: "pessoa@example.com",
    phone: "11900000000",
    areaOfExpertise: "TI",
    areaOfExpertiseId: null,
    professionalSummary: "Resumo",
  });
});

it("CA-02: rejeita nome vazio com resposta clara", async () => {
  const { app, repository } = makeApp();
  const response = await request(app).post("/resumes").send({ ...validBody, fullName: "   " }).expect(400);
  expect(response.body.message).toBeTruthy();
  expect(response.body.details.fullName).toBeTruthy();
  expect(repository.create).not.toHaveBeenCalled();
});

it("CA-02: rejeita e-mail ausente/inválido com resposta clara", async () => {
  const { app } = makeApp();
  await request(app).post("/resumes").send({ ...validBody, email: "" }).expect(400);
  const response = await request(app).post("/resumes").send({ ...validBody, email: "invalido" }).expect(400);
  expect(response.body.details.email).toBeTruthy();
});

it("CA-03: detalhes recuperam o candidato cadastrado", async () => {
  const { app, repository } = makeApp();
  const response = await request(app).get(`/resumes/${sample.id}`).expect(200);
  expect(response.body.id).toBe(sample.id);
  expect(repository.findById).toHaveBeenCalledWith(sample.id);
});

it("CA-04/CA-05: conflito de atualização retorna 409 com existingId e não sobrescreve outro candidato", async () => {
  const { app, repository } = makeApp({
    update: jest.fn().mockRejectedValue(new DuplicateEmailError("22222222-2222-4222-8222-222222222222")),
  });
  const response = await request(app).put(`/resumes/${sample.id}`).send({ ...validBody, email: "outro@example.com" }).expect(409);
  expect(response.body).toMatchObject({ code: "DUPLICATE_EMAIL", message: "Este e-mail já possui um cadastro.", existingId: "22222222-2222-4222-8222-222222222222" });
});

it("CA-05: criação duplicada retorna contrato com existingId", async () => {
  const { app } = makeApp({
    create: jest.fn().mockRejectedValue(new DuplicateEmailError("22222222-2222-4222-8222-222222222222")),
  });
  const response = await request(app).post("/resumes").send(validBody).expect(409);
  expect(response.body.existingId).toBe("22222222-2222-4222-8222-222222222222");
});

it("CA-05: consulta de registro inexistente retorna 404 claro", async () => {
  const { app } = makeApp({ findById: jest.fn().mockResolvedValue(null) });
  const response = await request(app).get("/resumes/33333333-3333-4333-8333-333333333333").expect(404);
  expect(response.body.message).toBe("Cadastro não encontrado.");
});

it("CA-07: exclusão remove (204) e registro inexistente retorna 404 claro", async () => {
  const { app, repository } = makeApp();
  await request(app).delete(`/resumes/${sample.id}`).expect(204);
  expect(repository.delete).toHaveBeenCalledWith(sample.id);
  const missing = makeApp({ delete: jest.fn().mockRejectedValue(new ResumeNotFoundError()) });
  const response = await request(missing.app).delete(`/resumes/${sample.id}`).expect(404);
  expect(response.body.message).toBe("Cadastro não encontrado.");
});

it("CA-06: Swagger documenta operações CRUD e erros, incluindo exclusão e conflito com existingId", async () => {
  const { app } = makeApp();
  const response = await request(app).get("/openapi.json").expect(200);
  const paths = response.body.paths;
  expect(paths["/resumes"].post.responses["409"].content["application/json"].schema.properties.existingId).toBeTruthy();
  expect(paths["/resumes/{id}"].get.responses["404"]).toBeTruthy();
  expect(paths["/resumes/{id}"].put.responses["409"].content["application/json"].schema.required).toContain("existingId");
  expect(paths["/resumes/{id}"].delete.responses["204"]).toBeTruthy();
  expect(paths["/resumes/{id}"].delete.responses["404"]).toBeTruthy();
});
