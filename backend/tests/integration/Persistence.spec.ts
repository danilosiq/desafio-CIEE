import { randomUUID } from "node:crypto";
import { requireTestDatabase } from "../DatabaseTestGuard";
import {
  getPrismaClient,
  disconnectDatabase,
} from "../../src/infra/database/PrismaClient";
import { PrismaResumeRepository } from "../../src/modules/resumes/infra/repositories/PrismaResumeRepository";
import { PrismaResumeProcessingJobRepository } from "../../src/modules/resume-processing/infra/repositories/PrismaResumeProcessingJobRepository";
import { DuplicateEmailError } from "../../src/modules/resumes/domain/DuplicateEmailError";

requireTestDatabase();
const client = getPrismaClient();
const resumes = new PrismaResumeRepository(client);
const jobs = new PrismaResumeProcessingJobRepository(client);
const emails: string[] = [];
const jobIds: string[] = [];
function email(): string {
  const value = `${randomUUID()}@example.com`;
  emails.push(value);
  return value;
}
afterAll(async () => {
  try {
    await client.resume.deleteMany({ where: { email: { in: emails } } });
    await client.resumeProcessingJob.deleteMany({
      where: { id: { in: jobIds } },
    });
  } finally {
    await disconnectDatabase();
  }
});
it("persists required and optional fields and reads the saved data", async () => {
  const data = {
    fullName: "Pessoa Fictícia",
    email: email(),
    phone: "11900000000",
    areaOfExpertise: "TI",
    professionalSummary: "Dados fictícios",
  };
  const saved = await resumes.create(data);
  expect(await resumes.findById(saved.id)).toMatchObject(data);
  expect(saved.createdAt).toBeInstanceOf(Date);
});
it("allows absent optional fields", async () => {
  expect(
    await resumes.create({ fullName: "Pessoa Fictícia", email: email() }),
  ).toMatchObject({
    phone: null,
    areaOfExpertise: null,
    professionalSummary: null,
  });
});
it("rejects normalized duplicates", async () => {
  const value = email();
  await resumes.create({ fullName: "Primeiro Cadastro", email: value });
  await expect(
    resumes.create({
      fullName: "Segundo Cadastro",
      email: ` ${value.toUpperCase()} `,
    }),
  ).rejects.toBeInstanceOf(DuplicateEmailError);
});
it("allows only one concurrent insert for the same email", async () => {
  const value = email();
  const results = await Promise.allSettled(
    [value, ` ${value.toUpperCase()} `].map((email) =>
      resumes.create({ fullName: "Pessoa Fictícia", email }),
    ),
  );
  expect(
    results.filter((result) => result.status === "fulfilled"),
  ).toHaveLength(1);
  const rejected = results.find(
    (result) => result.status === "rejected",
  ) as PromiseRejectedResult;
  expect(rejected.reason).toBeInstanceOf(DuplicateEmailError);
});
it("enforces uniqueness and normalization even for direct database writes", async () => {
  const value = email();
  await resumes.create({ fullName: "Pessoa Fictícia", email: value });
  await expect(
    client.resume.create({ data: { fullName: "Duplicado", email: value } }),
  ).rejects.toMatchObject({ code: "P2002" });
  await expect(
    client.resume.create({
      data: {
        fullName: "Não normalizado",
        email: ` ${email().toUpperCase()} `,
      },
    }),
  ).rejects.toThrow();
});
it("creates a Processing job without a Resume and finishes it", async () => {
  const job = await jobs.create();
  jobIds.push(job.id);
  expect(job.status).toBe("Processing");
  expect((await jobs.finish(job.id)).status).toBe("Finished");
  expect(await jobs.findById(job.id)).toMatchObject({ status: "Finished" });
});
it.each(["Failed", "processing", "Finished "])(
  "rejects unsupported job state %s at the database boundary",
  async (status) => {
    await expect(
      client.resumeProcessingJob.create({ data: { status } }),
    ).rejects.toThrow();
  },
);
it("returns null for missing resources", async () => {
  expect(await resumes.findById(randomUUID())).toBeNull();
  expect(await jobs.findById(randomUUID())).toBeNull();
});
