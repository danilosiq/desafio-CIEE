import { extractFields } from "../../src/modules/resume-processing/application/extraction/ExtractFields";
it("mantém ausência e não escolhe entre candidatos conflitantes ao longo do texto", () => {
  expect(extractFields("Ana Pereira\na@example.com\nPagina 2\nb@example.com")).toMatchObject({ data: { email: null, phone: null }, warnings: ["AMBIGUOUS_EMAIL"] });
});
it("considera emails repetidos equivalentes independente de caixa", () => {
  expect(extractFields("Ana Pereira\nANA@example.com\nana@example.com").data.email).toBe("ana@example.com");
});
it("mantém telefone quando variações de formatação representam o mesmo número", () => {
  expect(extractFields("Ana Pereira\n(11) 98888-0000\n11 98888 0000").data.phone).toBe("(11) 98888-0000");
});
