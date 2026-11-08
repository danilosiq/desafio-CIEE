import {
  createResume,
  deleteResume,
  getResume,
  listResumes,
  scanResume,
  updateResume,
} from "./ResumeService";
import { makeTextPdf } from "../../../../backend/tests/fixtures/MakeTextPdf";
import { EMPTY_RESUME } from "@/core/lib/ResumeValidation";
import type { ResumeInput } from "@/core/types/Resume";

let data: ResumeInput;
let createdIds: string[];

beforeAll(() => {
  if (
    process.env.FRONTEND_TEST_DATABASE !== "ciee_test" ||
    process.env.NEXT_PUBLIC_API_URL !== "http://127.0.0.1:3335"
  ) {
    throw new Error(
      "Execute esta suíte contra a API isolada na porta 3335 e o banco ciee_test.",
    );
  }
});

beforeEach(() => {
  createdIds = [];
  data = {
    ...EMPTY_RESUME,
    fullName: "Pessoa de Teste",
    email: `teste-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
  };
});

afterEach(async () => {
  for (const id of createdIds) await deleteResume({ id });
});

async function createFixture(input = data) {
  const created = await createResume({ data: input });
  createdIds.push(created.id);
  return created;
}

it("lista currículos e permite consultar detalhes", async () => {
  const created = await createFixture();
  const { items } = await listResumes();
  expect(items.find((item) => item.id === created.id)).toEqual(created);
  expect(await getResume({ id: created.id })).toEqual(created);
});
it("cadastra sem PDF e atualiza com confirmação explícita", async () => {
  const created = await createFixture();
  expect(
    (await listResumes()).items.find((r) => r.id === created.id),
  ).toMatchObject(data);
  expect(
    await updateResume({
      id: created.id,
      data: { ...data, areaOfExpertise: "Design" },
    }),
  ).toMatchObject({ areaOfExpertise: "Design" });
  expect(await getResume({ id: created.id })).toMatchObject({
    areaOfExpertise: "Design",
  });
});
it("bloqueia e-mail duplicado normalizando espaços e caixa", async () => {
  const existing = await createFixture();
  await expect(
    createResume({ data: { ...data, email: ` ${data.email.toUpperCase()} ` } }),
  ).rejects.toMatchObject({
    response: {
      status: 409,
      data: { code: "DUPLICATE_EMAIL", existingId: existing.id },
    },
  });
  expect(
    (await listResumes()).items.filter((r) => r.email === data.email),
  ).toHaveLength(1);
});
it("não permite atualização com e-mail de outro cadastro", async () => {
  const first = await createFixture();
  const secondData = { ...data, email: `outra-${data.email}` };
  const second = await createFixture(secondData);
  await expect(
    updateResume({
      id: second.id,
      data: { ...secondData, email: first.email },
    }),
  ).rejects.toMatchObject({
    response: {
      status: 409,
      data: { code: "DUPLICATE_EMAIL", existingId: first.id },
    },
  });
  expect((await getResume({ id: second.id })).email).toBe(second.email);
});
it("responde claramente para registro inexistente", async () => {
  await expect(
    getResume({ id: "00000000-0000-4000-8000-000000000000" }),
  ).rejects.toMatchObject({
    response: { status: 404 },
  });
});
it("não aceita dados inválidos mesmo no limite de comunicação", async () => {
  await expect(
    createResume({ data: { ...data, email: "invalido" } }),
  ).rejects.toMatchObject({
    response: { status: 400, data: { code: "VALIDATION_ERROR" } },
  });
});
it("extrai sugestões de PDF real sem cadastrar candidato", async () => {
  const pdf = new Uint8Array(
    makeTextPdf(["Camila Rocha", data.email, "(11) 99999-1234"]),
  ).buffer;
  const result = await scanResume({
    file: new File([pdf], "cv.pdf", { type: "application/pdf" }),
  });
  expect(result.data).toEqual({
    name: "Camila Rocha",
    email: data.email,
    phone: "(11) 99999-1234",
  });
  const firstPage = await listResumes();
  for (let page = 1; page <= firstPage.totalPages; page++) {
    const resultPage = page === 1 ? firstPage : await listResumes({ page });
    expect(resultPage.items.some((resume) => resume.email === data.email)).toBe(
      false,
    );
  }
});
it("retorna campos ausentes e rejeita PDF corrompido", async () => {
  const pdf = new Uint8Array(makeTextPdf(["camila.rocha@example.com"])).buffer;
  const partial = await scanResume({
    file: new File([pdf], "parcial.pdf", { type: "application/pdf" }),
  });
  expect(partial.data).toEqual({
    name: null,
    email: "camila.rocha@example.com",
    phone: null,
  });
  await expect(
    scanResume({
      file: new File(["%PDF-1.4\ncorrompido"], "invalido.pdf", {
        type: "application/pdf",
      }),
    }),
  ).rejects.toMatchObject({
    response: { status: 422, data: { error: { code: "PDF_UNREADABLE" } } },
  });
});
it("exclui somente o cadastro confirmado e trata registro inexistente", async () => {
  const created = await createFixture();
  await deleteResume({ id: created.id });
  createdIds = createdIds.filter((id) => id !== created.id);
  expect((await listResumes()).items.some((r) => r.id === created.id)).toBe(
    false,
  );
  await expect(getResume({ id: created.id })).rejects.toMatchObject({
    response: { status: 404 },
  });
  await expect(deleteResume({ id: created.id })).rejects.toMatchObject({
    response: { status: 404 },
  });
});
