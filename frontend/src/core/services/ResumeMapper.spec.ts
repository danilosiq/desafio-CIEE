import { normalizeResume } from "./ResumeMapper";

it("converte campos opcionais ausentes da API para valores editáveis", () => {
  const candidate = normalizeResume({
    id: "ficticio",
    fullName: "Ana Lima",
    email: "ana@example.com",
    phone: null,
    areaOfExpertise: null,
    professionalSummary: null,
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  });
  expect(candidate).toMatchObject({
    phone: "",
    areaOfExpertise: "",
    professionalSummary: "",
  });
});
