import { randomUUID } from "node:crypto";
import { requireTestDatabase } from "../DatabaseTestGuard";
import { getPrismaClient, disconnectDatabase } from "../../src/infra/database/PrismaClient";
import { PrismaResumeRepository } from "../../src/modules/resumes/infra/repositories/PrismaResumeRepository";
import { DuplicateEmailError } from "../../src/modules/resumes/domain/DuplicateEmailError";
import { ResumeNotFoundError } from "../../src/modules/resumes/domain/ResumeNotFoundError";

requireTestDatabase();
const client = getPrismaClient();
const resumes = new PrismaResumeRepository(client);
const emails: string[] = [];
const ids: string[] = [];
function email(): string {
  const value = `${randomUUID()}@example.com`;
  emails.push(value);
  return value;
}
afterAll(async () => {
  try {
    await client.resume.deleteMany({ where: { id: { in: ids } } });
    await client.resume.deleteMany({ where: { email: { in: emails } } });
  } finally {
    await disconnectDatabase();
  }
});

it("CA-01/CA-03: persiste os cinco campos sem arquivo e recupera em detalhes/listagem", async () => {
  const data = { fullName: "Pessoa Fictícia", email: email(), phone: "11900000000", interestArea: "TI", professionalSummary: "Resumo" };
  const saved = await resumes.create(data);
  ids.push(saved.id);
  expect(saved).toMatchObject(data);
  expect(await resumes.findById(saved.id)).toMatchObject(data);
  const listed = await resumes.list({ page: 1, limit: 30 });
  expect(listed.items.some((item) => item.id === saved.id)).toBe(true);
});

it("CA-04: atualização explícita persiste novos dados", async () => {
  const saved = await resumes.create({ fullName: "Antes", email: email(), phone: null, interestArea: null, professionalSummary: null });
  ids.push(saved.id);
  const updated = await resumes.update(saved.id, { fullName: "Depois", email: saved.email, phone: "11999999999", interestArea: "Dados", professionalSummary: "Novo" });
  expect(updated).toMatchObject({ id: saved.id, fullName: "Depois", phone: "11999999999", interestArea: "Dados", professionalSummary: "Novo" });
});

it("CA-04/CA-05: conflito de e-mail na atualização não sobrescreve outro candidato e informa existingId", async () => {
  const first = await resumes.create({ fullName: "Primeiro", email: email() });
  const second = await resumes.create({ fullName: "Segundo", email: email() });
  ids.push(first.id, second.id);
  await expect(resumes.update(second.id, { fullName: "Segundo", email: ` ${first.email.toUpperCase()} ` })).rejects.toMatchObject({
    name: "DuplicateEmailError",
    existingId: first.id,
  });
  expect(await resumes.findById(first.id)).toMatchObject({ fullName: "Primeiro", email: first.email });
});

it("CA-05: criação duplicada informa existingId", async () => {
  const value = email();
  const first = await resumes.create({ fullName: "Primeiro", email: value });
  ids.push(first.id);
  await expect(resumes.create({ fullName: "Outro", email: ` ${value.toUpperCase()} ` })).rejects.toMatchObject({
    name: "DuplicateEmailError",
    existingId: first.id,
  });
});

it("CA-07: exclusão remove das consultas e excluir inexistente é tratado", async () => {
  const saved = await resumes.create({ fullName: "Excluir", email: email() });
  ids.push(saved.id);
  await resumes.delete(saved.id);
  expect(await resumes.findById(saved.id)).toBeNull();
  const listed = await resumes.list({ page: 1, limit: 30 });
  expect(listed.items.some((item) => item.id === saved.id)).toBe(false);
  await expect(resumes.delete(randomUUID())).rejects.toBeInstanceOf(ResumeNotFoundError);
});
