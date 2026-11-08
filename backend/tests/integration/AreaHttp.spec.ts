import { randomUUID } from "node:crypto";
import request from "supertest";
import { createApp } from "../../src/main/App";
import { getPrismaClient, disconnectDatabase } from "../../src/infra/database/PrismaClient";
import { requireTestDatabase } from "../DatabaseTestGuard";

requireTestDatabase();
const client = getPrismaClient();
const app = createApp();
const ids: string[] = [];
afterAll(async () => {
  try { await client.areaOfExpertise.deleteMany({ where: { id: { in: ids } } }); }
  finally { await disconnectDatabase(); }
});
it("executa CRUD HTTP, valida nomes duplicados e preserva outras áreas", async () => {
  const name = `Área fictícia ${randomUUID()}`;
  const created = await request(app).post("/areas-of-expertise").send({ name, description: "Descrição de teste" }).expect(201);
  ids.push(created.body.id);
  await request(app).post("/areas-of-expertise").send({ name: ` ${name.toUpperCase()} `, description: "Duplicada" }).expect(409);
  const unaccented = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  await request(app).post("/areas-of-expertise").send({ name: unaccented, description: "Duplicada sem acento" }).expect(409);
  const other = await request(app).post("/areas-of-expertise").send({ name: `Outra ${randomUUID()}`, description: "Outra área" }).expect(201);
  ids.push(other.body.id);
  await request(app).put(`/areas-of-expertise/${other.body.id}`).send({ name: unaccented, description: "Edição duplicada" }).expect(409);
  await request(app).post("/areas-of-expertise").send({ name: "", description: "" }).expect(400);
  const list = await request(app).get("/areas-of-expertise").expect(200);
  expect(list.body).toEqual(expect.arrayContaining([expect.objectContaining({ id: created.body.id, name })]));
  await request(app).get(`/areas-of-expertise/${created.body.id}`).expect(200);
  await request(app).put(`/areas-of-expertise/${created.body.id}`).send({ name, description: "Atualizada" }).expect(200).expect(({ body }) => { expect(body.description).toBe("Atualizada"); });
  await request(app).delete(`/areas-of-expertise/${created.body.id}`).expect(204);
  await request(app).get(`/areas-of-expertise/${created.body.id}`).expect(404);
  await request(app).delete(`/areas-of-expertise/${created.body.id}`).expect(404);
});

it("retorna área vinculada no currículo, reflete renomeação e bloqueia exclusão", async () => {
  const area = await request(app).post("/areas-of-expertise").send({ name: `Área vinculada ${randomUUID()}`, description: "Fictícia" }).expect(201);
  ids.push(area.body.id);
  let resumeId: string | undefined;
  try {
    const created = await request(app).post("/resumes").send({ fullName: "Pessoa fictícia", email: `${randomUUID()}@example.com`, areaOfExpertiseId: area.body.id }).expect(201);
    resumeId = created.body.id;
    expect(created.body).toMatchObject({ areaOfExpertiseId: area.body.id, areaOfExpertise: area.body.name });
    const name = `Área renomeada ${randomUUID()}`;
    await request(app).put(`/areas-of-expertise/${area.body.id}`).send({ name, description: "Fictícia" }).expect(200);
    const retrieved = await request(app).get(`/resumes/${resumeId}`).expect(200);
    expect(retrieved.body).toMatchObject({ areaOfExpertiseId: area.body.id, areaOfExpertise: name });
    await request(app).delete(`/areas-of-expertise/${area.body.id}`).expect(409);
    const invalid = await request(app).post("/resumes").send({ fullName: "Pessoa", email: `${randomUUID()}@example.com`, areaOfExpertiseId: randomUUID() }).expect(400);
    expect(invalid.body).toMatchObject({ code: "VALIDATION_ERROR", details: { areaOfExpertiseId: expect.any(String) } });
  } finally {
    if (resumeId) await client.resume.deleteMany({ where: { id: resumeId } });
  }
});
