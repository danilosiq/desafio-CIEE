import { normalizeEmail } from "../../src/modules/resumes/domain/NormalizeEmail";
describe("email identity", () => {
  it("trims spaces and ignores case for duplicate detection", () => {
    expect(normalizeEmail("  Candidate@Example.COM  ")).toBe(
      "candidate@example.com",
    );
  });
  it("preserves plus tags and dots", () => {
    expect(normalizeEmail(" A.B+CV@Example.com ")).toBe("a.b+cv@example.com");
  });
});
