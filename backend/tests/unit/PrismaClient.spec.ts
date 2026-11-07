import {
  getPrismaClient,
  disconnectDatabase,
} from "../../src/infra/database/PrismaClient";
const original = process.env.DATABASE_URL;
afterEach(async () => {
  await disconnectDatabase();
  if (original === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = original;
});
it("requires external connection configuration", () => {
  delete process.env.DATABASE_URL;
  expect(getPrismaClient).toThrow("DATABASE_URL is required");
});
it("reuses a client and allows a fresh lifecycle after disconnect", async () => {
  process.env.DATABASE_URL =
    "sqlserver://localhost:14339;database=ciee_test;user=sa;password=fake";
  const first = getPrismaClient();
  expect(getPrismaClient()).toBe(first);
  await disconnectDatabase();
  expect(getPrismaClient()).not.toBe(first);
});
