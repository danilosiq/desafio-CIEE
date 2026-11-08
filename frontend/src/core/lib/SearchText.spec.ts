import { matchesSearch } from "./SearchText";

it("encontra texto independentemente de acentos e maiúsculas", () => {
  expect(matchesSearch("João Administração", "JOAO administracao")).toBe(true);
  expect(matchesSearch("JOAO ADMINISTRACAO", "joão administração")).toBe(true);
  expect(matchesSearch("Educação", "saude")).toBe(false);
  expect(matchesSearch("Educação", "")).toBe(true);
});
