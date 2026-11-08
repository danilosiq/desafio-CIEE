import { createElement } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ResumeProfile } from "./ResumeProfile";
import { api } from "@/core/services/Api";
import type { Resume } from "@/core/types/Resume";

jest.mock("@/core/services/Api", () => ({
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

const area = {
  id: "area-design",
  name: "Design de produto",
  description: "Área",
};
const resumeFixtures: Resume[] = [
  {
    id: "ana-pereira",
    fullName: "Ana Pereira",
    email: "ana@example.com",
    phone: "(11) 98765-4321",
    areaOfExpertise: "Design de produto",
    areaOfExpertiseId: area.id,
    professionalSummary: "Resumo profissional fictício",
    createdAt: "2026-11-04T12:00:00.000Z",
    updatedAt: "2026-11-04T12:00:00.000Z",
  },
  {
    id: "lucas-oliveira",
    fullName: "Lucas Oliveira",
    email: "lucas@example.com",
    phone: "",
    areaOfExpertise: "",
    professionalSummary: "",
    createdAt: "2026-11-03T14:00:00.000Z",
    updatedAt: "2026-11-03T14:00:00.000Z",
  },
];

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const onSaved = jest.fn();
  render(
    createElement(
      QueryClientProvider,
      { client },
      createElement(ResumeProfile, {
        resume: resumeFixtures[0],
        editing: true,
        onSaved,
      }),
    ),
  );
  return { user: userEvent.setup(), onSaved };
}

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  mockedApi.get.mockImplementation((url: string) => {
    if (url === "/areas-of-expertise") return Promise.resolve({ data: [area] });
    return Promise.reject(new Error(`unexpected GET ${url}`));
  });
  mockedApi.put.mockImplementation(
    (_url: string, body: Record<string, unknown>) =>
      Promise.resolve({
        data: {
          ...resumeFixtures[0],
          ...body,
          updatedAt: "2026-11-07T10:00:00.000Z",
        },
      }),
  );
});

it("edita os campos no próprio perfil e desfaz sem persistir", async () => {
  const { user, onSaved } = setup();
  const input = screen.getByLabelText("Nome completo");
  await user.clear(input);
  await user.type(input, "Alteração temporária");
  await user.click(screen.getByRole("button", { name: "Desfazer" }));
  expect(input).toHaveValue("Ana Pereira");
  expect(onSaved).not.toHaveBeenCalled();
});

it("valida e-mail com Zod antes de concluir e preserva o resumo", async () => {
  const { user, onSaved } = setup();
  await user.clear(screen.getByLabelText("E-mail"));
  await user.type(screen.getByLabelText("E-mail"), "invalido");
  await user.clear(screen.getByLabelText("Resumo profissional"));
  await user.type(
    screen.getByLabelText("Resumo profissional"),
    "Meu resumo revisado",
  );
  await user.click(screen.getByRole("button", { name: "Concluir" }));
  expect(
    await screen.findByText("Informe um e-mail válido."),
  ).toBeInTheDocument();
  expect(screen.getByLabelText("Resumo profissional")).toHaveValue(
    "Meu resumo revisado",
  );
  expect(onSaved).not.toHaveBeenCalled();
});

it("conclui a alteração explicitamente com telefone formatado", async () => {
  const { user, onSaved } = setup();
  await user.clear(screen.getByLabelText("Telefone"));
  await user.type(screen.getByLabelText("Telefone"), "21987654321");
  await user.click(screen.getByRole("button", { name: "Concluir" }));
  await waitFor(() => {
    expect(onSaved).toHaveBeenCalledWith(
      expect.objectContaining({ phone: "(21) 98765-4321" }),
    );
  });
});

it("oferece editar o cadastro existente ao conflitar e-mail na edição", async () => {
  mockedApi.put.mockRejectedValueOnce(
    Object.assign(new Error("dup"), {
      isAxiosError: true,
      response: {
        status: 409,
        data: {
          code: "DUPLICATE_EMAIL",
          message: "Este e-mail já possui um cadastro.",
          existingId: resumeFixtures[1].id,
        },
      },
    }),
  );
  const { user, onSaved } = setup();
  await user.clear(screen.getByLabelText("E-mail"));
  await user.type(screen.getByLabelText("E-mail"), resumeFixtures[1].email);
  await user.click(screen.getByRole("button", { name: "Concluir" }));
  expect(
    await screen.findByRole("link", { name: "Editar cadastro existente" }),
  ).toHaveAttribute("href", `/candidatos/${resumeFixtures[1].id}/editar`);
  expect(screen.getByLabelText("E-mail")).toHaveValue(resumeFixtures[1].email);
  expect(onSaved).not.toHaveBeenCalled();
});

it("exige uma área livre ao trocar uma referência do catálogo por Outros", async () => {
  const { user, onSaved } = setup();
  await screen.findByRole("option", { name: area.name });
  await waitFor(() =>
    expect(screen.getByLabelText("Área de atuação")).toBeEnabled(),
  );
  await user.selectOptions(screen.getByLabelText("Área de atuação"), "__other");
  expect(screen.getByLabelText("Informe a área de atuação")).toHaveValue("");
  await user.click(screen.getByRole("button", { name: "Concluir" }));
  expect(
    await screen.findByText("Informe a área de atuação."),
  ).toBeInTheDocument();
  expect(onSaved).not.toHaveBeenCalled();
});

it("preserva a identificação da área vinculada quando o catálogo falha", async () => {
  mockedApi.get.mockImplementation((url: string) => {
    if (url === "/areas-of-expertise")
      return Promise.reject(new Error("network"));
    return Promise.reject(new Error(`unexpected GET ${url}`));
  });
  setup();
  await screen.findByText(
    "Não foi possível listar as áreas. Você pode usar Outros.",
  );
  expect(screen.getByRole("option", { name: area.name })).toBeInTheDocument();
  expect(screen.getByLabelText("Área de atuação")).toHaveValue(area.id);
});
