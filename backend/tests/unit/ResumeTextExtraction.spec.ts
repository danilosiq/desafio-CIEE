import { extractFields } from "../../src/modules/resume-processing/application/extraction/ExtractFields";

describe("extração determinística de campos", () => {
  it("identifica dados em currículo com cabeçalho genérico", () => {
    expect(extractFields("CURRÍCULO\nAna Maria Silva\nDesenvolvedora de software\nana@example.com,\nTelefone: +55 (11) 99999-0000")).toMatchObject({ data: { name: "Ana Maria Silva", email: "ana@example.com", phone: "+55 (11) 99999-0000" }, warnings: [], extraction: { status: "success", method: "text-rules" } });
  });
  it("não confunde cargo com nome e preserva ausência", () => {
    expect(extractFields("Desenvolvedor Full Stack\nExperiência profissional\nPython React\nemail: dev@example.com").data).toEqual({ name: null, email: "dev@example.com", phone: null, professionalSummary: null });
  });
  it("retorna aviso quando texto não contém dados identificáveis", () => {
    expect(extractFields("Objetivo\nExperiência profissional\nFormação acadêmica")).toMatchObject({ data: { name: null, email: null, phone: null }, warnings: ["NO_FIELDS_IDENTIFIED"], extraction: { status: "partial" } });
  });
  it("não confunde CPF, CNPJ, CEP ou datas com telefone", () => {
    expect(extractFields("Dados Pessoais\nCPF 123.456.789-09\nCEP 12345-678\n01/01/1999\nCNPJ 12.345.678/0001-90").data.phone).toBeNull();
  });
  it("não escolhe silenciosamente contatos conflitantes", () => {
    expect(extractFields("Ana Silva\na@example.com\nb@example.com\n(11) 99999-0000\n(21) 98888-0000")).toMatchObject({ data: { name: "Ana Silva", email: null, phone: null }, warnings: expect.arrayContaining(["AMBIGUOUS_EMAIL", "AMBIGUOUS_PHONE"]) });
  });
  it("prioriza contato do candidato diante de referências marcadas", () => {
    expect(extractFields("Ana Silva\nana@example.com\nReferência profissional: outra@example.com").data.email).toBe("ana@example.com");
  });
});

 it("sugere parágrafo com mais de três linhas", () => {
  const text = "RESUMO PROFISSIONAL\nPrimeira linha longa que descreve minha experiência profissional\nSegunda linha longa sobre conhecimentos e habilidades técnicas\nTerceira linha longa explicando projetos e atividades realizadas\nQuarta linha final do resumo.\nCOMPETÊNCIAS";
  expect(extractFields(text).data.professionalSummary).toContain("Quarta linha final do resumo.");
  expect(extractFields("RESUMO\nUma linha curta\nDuas linhas\nTrês linhas\nEXPERIÊNCIA").data.professionalSummary).toBeNull();
 });
