import {
  createResume,
  deleteResume,
  getResume,
  listResumes,
  scanResume,
  updateResume,
} from "./ResumeService";
import { api } from "./Api";
import { EMPTY_RESUME } from "@/core/lib/ResumeValidation";

jest.mock("./Api", () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    defaults: { baseURL: "/api" },
  },
}));

const mockedApi = api as unknown as {
  get: jest.Mock;
  post: jest.Mock;
  put: jest.Mock;
  delete: jest.Mock;
  defaults: { baseURL: string };
};

const resume = {
  id: "11111111-1111-4111-8111-111111111111",
  fullName: "Pessoa de Teste",
  email: "teste@example.com",
  phone: null,
  areaOfExpertise: null,
  professionalSummary: null,
  createdAt: "2026-11-07T10:00:00.000Z",
  updatedAt: "2026-11-07T10:00:00.000Z",
};

const normalizedResume = {
  ...resume,
  phone: "",
  areaOfExpertise: "",
  professionalSummary: "",
};

const data = {
  ...EMPTY_RESUME,
  fullName: "Pessoa de Teste",
  email: "teste@example.com",
};

beforeEach(() => {
  jest.clearAllMocks();
});

it("lista currículos paginados e normaliza itens", async () => {
  mockedApi.get.mockResolvedValue({
    data: {
      items: [resume],
      page: 1,
      limit: 30,
      total: 1,
      totalPages: 1,
    },
  });
  await expect(listResumes()).resolves.toEqual({
    items: [normalizedResume],
    page: 1,
    limit: 30,
    total: 1,
    totalPages: 1,
  });
  expect(mockedApi.get).toHaveBeenCalledWith("/resumes", {
    params: { page: 1, limit: 30 },
  });
});

it("aceita resposta legada em array e consulta detalhes", async () => {
  mockedApi.get.mockResolvedValueOnce({ data: [resume] });
  await expect(listResumes({ page: 2, limit: 10 })).resolves.toEqual({
    items: [normalizedResume],
    page: 2,
    limit: 10,
    total: 1,
    totalPages: 1,
  });
  mockedApi.get.mockResolvedValueOnce({ data: resume });
  await expect(getResume({ id: resume.id })).resolves.toEqual(normalizedResume);
});

it("cadastra e atualiza currículo", async () => {
  mockedApi.post.mockResolvedValue({ data: resume });
  await expect(createResume({ data })).resolves.toEqual(normalizedResume);
  expect(mockedApi.post).toHaveBeenCalledWith("/resumes", data);
  const updated = { ...resume, areaOfExpertise: "Design" };
  mockedApi.put.mockResolvedValue({ data: updated });
  await expect(
    updateResume({
      id: resume.id,
      data: { ...data, areaOfExpertise: "Design" },
    }),
  ).resolves.toEqual({ ...normalizedResume, areaOfExpertise: "Design" });
  expect(mockedApi.put).toHaveBeenCalledWith("/resumes/" + resume.id, {
    ...data,
    areaOfExpertise: "Design",
  });
});

it("propaga conflito de e-mail duplicado com existingId", async () => {
  const conflict = Object.assign(new Error("conflict"), {
    response: {
      status: 409,
      data: {
        code: "DUPLICATE_EMAIL",
        message: "Este e-mail já possui um cadastro.",
        existingId: "22222222-2222-4222-8222-222222222222",
      },
    },
  });
  mockedApi.post.mockRejectedValue(conflict);
  await expect(createResume({ data })).rejects.toMatchObject({
    response: { status: 409, data: { code: "DUPLICATE_EMAIL" } },
  });
});

it("propaga validação, não encontrado e falha de scan", async () => {
  mockedApi.post.mockRejectedValueOnce(
    Object.assign(new Error("bad"), {
      response: { status: 400, data: { code: "VALIDATION_ERROR" } },
    }),
  );
  await expect(
    createResume({ data: { ...data, email: "invalido" } }),
  ).rejects.toMatchObject({
    response: { status: 400, data: { code: "VALIDATION_ERROR" } },
  });

  mockedApi.get.mockRejectedValueOnce(
    Object.assign(new Error("missing"), { response: { status: 404 } }),
  );
  await expect(getResume({ id: "missing" })).rejects.toMatchObject({
    response: { status: 404 },
  });

  mockedApi.post.mockRejectedValueOnce(
    Object.assign(new Error("unreadable"), {
      response: { status: 422, data: { error: { code: "PDF_UNREADABLE" } } },
    }),
  );
  await expect(
    scanResume({
      file: new File(["x"], "cv.pdf", { type: "application/pdf" }),
    }),
  ).rejects.toMatchObject({
    response: { status: 422, data: { error: { code: "PDF_UNREADABLE" } } },
  });
});

it("envia PDF para scan e exclui currículo", async () => {
  const scan = { data: { name: "Ana", email: "ana@example.com", phone: null } };
  mockedApi.post.mockResolvedValueOnce({ data: scan });
  const file = new File(["pdf"], "cv.pdf", { type: "application/pdf" });
  await expect(scanResume({ file })).resolves.toEqual(scan);
  const [url, body] = mockedApi.post.mock.calls[0];
  expect(url).toBe("/scan");
  expect(body).toBeInstanceOf(FormData);
  expect((body as FormData).get("file")).toBe(file);

  mockedApi.delete.mockResolvedValueOnce({});
  await expect(deleteResume({ id: resume.id })).resolves.toBeUndefined();
  mockedApi.delete.mockRejectedValueOnce(
    Object.assign(new Error("missing"), { response: { status: 404 } }),
  );
  await expect(deleteResume({ id: resume.id })).rejects.toMatchObject({
    response: { status: 404 },
  });
});
