import { randomUUID } from "node:crypto";
import request from "supertest";
import { requireTestDatabase } from "../DatabaseTestGuard";
import { getPrismaClient, disconnectDatabase } from "../../src/infra/database/PrismaClient";
import { createApp } from "../../src/main/App";
import { makePdf } from "../fixtures/MakePdf";

requireTestDatabase();
const client = getPrismaClient();
const app = createApp();
const emails: string[] = [];
afterAll(async () => {
  try { await client.resume.deleteMany({ where: { email: { in: emails } } }); }
  finally { await disconnectDatabase(); }
});
it("PDF sem texto não grava candidato e permite cadastro manual e conflito explícito", async () => {
  const before = await client.resume.count();
  await request(app).post("/scan").attach("file", makePdf(), "ficticio.pdf").expect(422);
  expect(await client.resume.count()).toBe(before);
  const email = `${randomUUID()}@example.com`; emails.push(email);
  const input = { fullName: "Pessoa Fictícia", email, phone: "11999999999", areaOfExpertise: "Tecnologia", professionalSummary: "Teste" };
  const created = await request(app).post("/resumes").send(input).expect(201);
  const detail = await request(app).get(`/resumes/${created.body.id}`).expect(200);
  expect(detail.body).toMatchObject(input);
  const duplicate = await request(app).post("/resumes").send(input).expect(409);
  expect(duplicate.body.existingId).toBe(created.body.id);
  expect((await request(app).get(`/resumes/${created.body.id}`).expect(200)).body).toMatchObject(input);
});
