import {
  EMPTY_RESUME,
  formatPhone,
  MAX_PDF_BYTES,
  validatePdf,
  validateResume,
} from "./ResumeValidation";
const valid = {
  ...EMPTY_RESUME,
  fullName: "Ana Pereira",
  email: "ana@example.com",
};
describe("Regras do formulário", () => {
  it("permite cadastro manual sem PDF e sem campos opcionais", () => {
    expect(validateResume(valid)).toEqual({});
  });
  it.each(["", "   "])("rejeita nome vazio: %p", (fullName) => {
    expect(validateResume({ ...valid, fullName }).fullName).toBeTruthy();
  });
  it.each(["", "ana", "ana@", "ana@exemplo", "a b@example.com"])(
    "rejeita e-mail inválido: %p",
    (email) => {
      expect(validateResume({ ...valid, email }).email).toBeTruthy();
    },
  );
  it("aceita espaços externos em valores válidos", () => {
    expect(validateResume({ ...valid, email: " ana@example.com " })).toEqual(
      {},
    );
  });
});
describe("Validação do PDF", () => {
  it("aceita PDF no limite de 5 MB", () => {
    expect(
      validatePdf(
        new File([new Uint8Array(MAX_PDF_BYTES)], "curriculo.pdf", {
          type: "application/pdf",
        }),
      ),
    ).toBeNull();
  });
  it("rejeita arquivo acima de 5 MB", () => {
    expect(
      validatePdf(
        new File([new Uint8Array(MAX_PDF_BYTES + 1)], "curriculo.pdf", {
          type: "application/pdf",
        }),
      ),
    ).toMatch(/5 MB/);
  });
  it("rejeita outro formato", () => {
    expect(
      validatePdf(new File(["texto"], "curriculo.txt", { type: "text/plain" })),
    ).toMatch(/PDF/);
  });
  it("rejeita arquivo vazio", () => {
    expect(
      validatePdf(new File([], "curriculo.pdf", { type: "application/pdf" })),
    ).toBeTruthy();
  });
});

it("preserva o número internacional completo recebido na leitura", () => {
  expect(formatPhone("+55 11 98888-0000")).toBe("+55 11 98888-0000");
});

it("aceita PDF quando o navegador não informa o MIME", () => {
  expect(validatePdf(new File(["%PDF-1.4"], "curriculo.pdf"))).toBeNull();
});
