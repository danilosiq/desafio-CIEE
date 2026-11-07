import {
  createResume,
  deleteResume,
  getResume,
  listResumes,
  scanResume,
  updateResume,
} from "./ResumeService";
const SCAN_FIXTURE_NAMES = {
  success: "curriculo-exemplo.pdf",
  partial: "fixture-leitura-parcial.pdf",
  error: "fixture-falha-leitura.pdf",
} as const;
import { EMPTY_RESUME } from "@/core/lib/ResumeValidation";
const data = {
  ...EMPTY_RESUME,
  fullName: "Pessoa de Teste",
  email: "teste@example.com",
};
beforeEach(() => {
  localStorage.clear();
});
it("lista currículos e permite consultar detalhes", async () => {
  const { items } = await listResumes();
  expect(items.length).toBeGreaterThan(0);
  expect(await getResume({ id: items[0].id })).toEqual(items[0]);
});
it("cadastra sem PDF e atualiza com confirmação explícita", async () => {
  const created = await createResume({ data });
  expect((await listResumes()).items.find((r) => r.id === created.id)).toMatchObject(
    data,
  );
  expect(
    await updateResume({
      id: created.id,
      data: { ...data, areaOfExpertise: "Design" },
    }),
  ).toMatchObject({ areaOfExpertise: "Design" });
});
it("bloqueia e-mail duplicado normalizando espaços e caixa", async () => {
  const existing = await createResume({ data });
  await expect(
    createResume({ data: { ...data, email: " TESTE@EXAMPLE.COM " } }),
  ).rejects.toMatchObject({
    response: { status: 409, data: { existingId: existing.id } },
  });
  expect(
    (await listResumes()).items.filter((r) => r.email === data.email),
  ).toHaveLength(1);
});
it("não permite atualização com e-mail de outro cadastro", async () => {
  const { items } = await listResumes();
  const created = await createResume({ data });
  await expect(
    updateResume({ id: created.id, data: { ...data, email: items[0].email } }),
  ).rejects.toMatchObject({ response: { status: 409 } });
});
it("responde claramente para registro inexistente", async () => {
  await expect(getResume({ id: "nao-existe" })).rejects.toMatchObject({
    response: { status: 404 },
  });
});
it("não aceita dados inválidos mesmo no limite de comunicação", async () => {
  await expect(
    createResume({ data: { ...data, email: "invalido" } }),
  ).rejects.toMatchObject({ response: { status: 422 } });
});
it("extração simulada devolve sugestões sem cadastrar", async () => {
  const before = (await listResumes()).items;
  const result = await scanResume({
    file: new File(["%PDF-1.4"], "cv.pdf", { type: "application/pdf" }),
  });
  expect(result).toMatchObject({
    fullName: expect.any(String),
    email: expect.any(String),
  });
  expect((await listResumes()).items).toHaveLength(before.length);
});
it("permite campos ausentes e simula falha de extração", async () => {
  const file = new File(["%PDF-1.4"], SCAN_FIXTURE_NAMES.partial, {
    type: "application/pdf",
  });
  expect(await scanResume({ file })).toMatchObject({
    fullName: null,
    phone: null,
  });
  await expect(
    scanResume({
      file: new File(["%PDF-1.4"], SCAN_FIXTURE_NAMES.error, {
        type: "application/pdf",
      }),
    }),
  ).rejects.toMatchObject({
    response: { status: 503 },
  });
});

it("exclui somente o cadastro confirmado e trata registro inexistente", async () => {
  const { items } = await listResumes();
  await deleteResume({ id: items[0].id });
  expect((await listResumes()).items.some((r) => r.id === items[0].id)).toBe(false);
  await expect(getResume({ id: items[0].id })).rejects.toMatchObject({
    response: { status: 404 },
  });
  await expect(deleteResume({ id: items[0].id })).rejects.toMatchObject({
    response: { status: 404 },
  });
});
