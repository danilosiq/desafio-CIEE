import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { requireTestDatabase } from "../DatabaseTestGuard";
import {
  getPrismaClient,
  disconnectDatabase,
} from "../../src/infra/database/PrismaClient";

requireTestDatabase();
const email = `${randomUUID()}@example.com`;
let areaId: string | undefined;
function run(source: string): Record<string, string> {
  const output = execFileSync(process.execPath, ["-e", source], {
    cwd: resolve(__dirname, "../.."),
    env: process.env,
    encoding: "utf8",
    timeout: 30000,
  });
  return JSON.parse(output);
}
const setup = `
const { getPrismaClient, disconnectDatabase } = require('./dist/infra/database/PrismaClient');
const { PrismaResumeRepository } = require('./dist/modules/resumes/infra/repositories/PrismaResumeRepository');
const { PrismaAreaOfExpertiseRepository } = require('./dist/modules/areas-of-expertise/infra/repositories/PrismaAreaOfExpertiseRepository');
const client = getPrismaClient();
const areas = new PrismaAreaOfExpertiseRepository(client);
const resumes = new PrismaResumeRepository(client);
`;
afterAll(async () => {
  const client = getPrismaClient();
  try {
    await client.resume.deleteMany({ where: { email } });
    if (areaId) await client.areaOfExpertise.deleteMany({ where: { id: areaId } });
  } finally {
    await disconnectDatabase();
  }
});
it("compiled repositories preserve data across process restarts", () => {
  const saved = run(
    setup +
      `
(async () => {
  try {
    const resume = await resumes.create({ fullName: 'Pessoa Fictícia', email: ${JSON.stringify(` ${email.toUpperCase()} `)} });
    const area = await areas.create({ name: 'Tecnologia', description: 'Software e infraestrutura' });
    console.log(JSON.stringify({ resumeId: resume.id, areaId: area.id }));
  } finally { await disconnectDatabase(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
`,
  );
  areaId = saved.areaId;
  const loaded = run(
    setup +
      `
(async () => {
  try {
    const resume = await resumes.findById(${JSON.stringify(saved.resumeId)});
    const area = await areas.findById(${JSON.stringify(areaId)});
    let duplicateError;
    try { await resumes.create({ fullName: 'Duplicado', email: ${JSON.stringify(email)} }); }
    catch (error) { duplicateError = error.name; }
    console.log(JSON.stringify({ email: resume.email, duplicateError, areaName: area.name, areaDescription: area.description }));
  } finally { await disconnectDatabase(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
`,
  );
  expect(loaded).toEqual({
    email,
    duplicateError: "DuplicateEmailError",
    areaName: "Tecnologia",
    areaDescription: "Software e infraestrutura",
  });
});
