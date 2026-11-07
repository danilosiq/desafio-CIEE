import { requireTestDatabase } from "../DatabaseTestGuard";
const original = process.env.DATABASE_URL;
afterEach(() => {
  if (original === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = original;
});
it.each([
  "",
  "sqlserver://production:1433;database=ciee_test",
  "sqlserver://localhost:1433;database=production",
  "sqlserver://localhost:1433;database=ciee_test;database=production",
])("refuses unsafe database %s", (url) => {
  process.env.DATABASE_URL = url;
  expect(requireTestDatabase).toThrow("local database ciee_test");
});
it("accepts the dedicated local test database", () => {
  process.env.DATABASE_URL =
    "sqlserver://localhost:1433;database=ciee_test;user=sa;password=fake";
  expect(requireTestDatabase).not.toThrow();
});
