import { createElement } from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AreasPage } from "./AreasPage";
import { api } from "@/core/services/Api";
import type { AreaOfExpertise } from "@/core/types/AreaOfExpertise";

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

function axiosError(status: number, data: Record<string, unknown> = {}) {
  return Object.assign(new Error("request failed"), {
    isAxiosError: true,
    response: { status, data },
  });
}

const ts = "2026-11-07T10:00:00.000Z";
let areas: AreaOfExpertise[];
const linkedArea: AreaOfExpertise = {
  id: "area-linked",
  name: "Área vinculada",
  description: "Área vinculada ao candidato",
  createdAt: ts,
  updatedAt: ts,
};

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    createElement(QueryClientProvider, { client }, createElement(AreasPage)),
  );
  return userEvent.setup();
}

beforeEach(() => {
  jest.clearAllMocks();
  areas = [
    {
      id: "area-admin",
      name: "Administração de produto",
      description: "Área fictícia",
      createdAt: ts,
      updatedAt: ts,
    },
  ];
  mockedApi.get.mockImplementation((url: string) => {
    if (url === "/areas-of-expertise")
      return Promise.resolve({ data: [...areas] });
    if (url === `/areas-of-expertise/${linkedArea.id}`)
      return Promise.resolve({ data: linkedArea });
    return Promise.reject(new Error(`unexpected GET ${url}`));
  });
  mockedApi.post.mockImplementation(
    (url: string, body: { name: string; description: string }) => {
      if (url === "/areas-of-expertise") {
        const created: AreaOfExpertise = {
          ...body,
          id: `area-${areas.length + 1}`,
          createdAt: ts,
          updatedAt: ts,
        };
        areas = [...areas, created];
        return Promise.resolve({ data: created });
      }
      return Promise.reject(new Error(`unexpected POST ${url}`));
    },
  );
  mockedApi.put.mockImplementation(
    (url: string, body: Partial<AreaOfExpertise>) => {
      const id = url.split("/").pop() ?? "";
      const existing = areas.find((a) => a.id === id);
      const updated = {
        ...existing,
        ...body,
        id,
        createdAt: existing?.createdAt ?? ts,
        updatedAt: ts,
      } as AreaOfExpertise;
      areas = areas.map((a) => (a.id === id ? updated : a));
      return Promise.resolve({ data: updated });
    },
  );
  mockedApi.delete.mockImplementation((url: string) => {
    if (url === `/areas-of-expertise/${linkedArea.id}`)
      return Promise.reject(
        axiosError(409, {
          message: "Área vinculada a candidatos não pode ser excluída.",
        }),
      );
    const id = url.split("/").pop();
    areas = areas.filter((a) => a.id !== id);
    return Promise.resolve({ data: {} });
  });
});

it("lista, pesquisa e recupera o estado vazio", async () => {
  const user = setup();
  await screen.findByRole("heading", { name: "Administração de produto" });
  await user.type(screen.getByLabelText("Buscar áreas de atuação"), "Nada");
  expect(screen.getByText("Nenhuma área encontrada")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Limpar pesquisa" }));
  expect(
    screen.getByRole("heading", { name: "Administração de produto" }),
  ).toBeInTheDocument();
});

it("encontra área sem considerar acentos ou maiúsculas", async () => {
  const user = setup();
  await screen.findByRole("heading", { name: "Administração de produto" });
  await user.type(
    screen.getByLabelText("Buscar áreas de atuação"),
    "ADMINISTRACAO",
  );
  expect(
    screen.getByRole("heading", { name: "Administração de produto" }),
  ).toBeInTheDocument();
});

it("valida nome/descrição e cria uma categoria real", async () => {
  const user = setup();
  await user.click(screen.getByRole("button", { name: "Cadastrar área" }));
  await user.click(screen.getByRole("button", { name: "Salvar área" }));
  expect(
    await screen.findByText("Informe o nome da área."),
  ).toBeInTheDocument();
  expect(screen.getByText("Informe a descrição da área.")).toBeInTheDocument();
  await user.type(screen.getByLabelText(/Nome da área/), "Educação");
  await user.type(
    screen.getByLabelText(/Descrição da área/),
    "Projetos educacionais",
  );
  await user.click(screen.getByRole("button", { name: "Salvar área" }));
  expect(
    await screen.findByRole("heading", { name: "Educação" }),
  ).toBeInTheDocument();
  expect(mockedApi.post).toHaveBeenCalledWith(
    "/areas-of-expertise",
    expect.objectContaining({
      name: "Educação",
      description: "Projetos educacionais",
    }),
  );
});

it("consulta detalhes, permite cancelar exclusão e explica o bloqueio de uma área vinculada", async () => {
  areas = [...areas, linkedArea];
  const user = setup();
  await user.click(
    await screen.findByRole("button", {
      name: "Consultar área Área vinculada",
    }),
  );
  expect(
    await screen.findByRole("dialog", { name: "Detalhes da área de atuação" }),
  ).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Fechar" }));
  await user.click(
    await screen.findByRole("button", { name: "Excluir área Área vinculada" }),
  );
  await user.click(screen.getByRole("button", { name: "Cancelar" }));
  await user.click(
    await screen.findByRole("button", { name: "Excluir área Área vinculada" }),
  );
  await user.click(screen.getByRole("button", { name: "Confirmar exclusão" }));
  expect(
    await screen.findByText(
      /Área vinculada a candidatos não pode ser excluída/,
    ),
  ).toBeInTheDocument();
  expect(areas.some((a) => a.id === linkedArea.id)).toBe(true);
});

it("trata falha na consulta e permite tentar novamente", async () => {
  mockedApi.get.mockReset();
  mockedApi.get
    .mockRejectedValueOnce(new Error("network"))
    .mockResolvedValueOnce({ data: [...areas] });
  const user = setup();
  expect(
    await screen.findByText("Não foi possível carregar as áreas de atuação."),
  ).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Tentar novamente" }));
  expect(
    await screen.findByRole("heading", { name: "Administração de produto" }),
  ).toBeInTheDocument();
});

it("preserva formulário após falha na operação e permite tentar novamente", async () => {
  mockedApi.post
    .mockRejectedValueOnce(axiosError(500, { message: "falha" }))
    .mockImplementationOnce(
      (_url: string, body: { name: string; description: string }) => {
        const created: AreaOfExpertise = {
          ...body,
          id: "area-new",
          createdAt: ts,
          updatedAt: ts,
        };
        areas = [...areas, created];
        return Promise.resolve({ data: created });
      },
    );
  const user = setup();
  await screen.findByRole("heading", { name: "Administração de produto" });
  await user.click(screen.getByRole("button", { name: "Cadastrar área" }));
  const name = "Categoria após falha";
  await user.type(screen.getByLabelText(/Nome da área/), name);
  await user.type(
    screen.getByLabelText(/Descrição da área/),
    "Descrição preservada",
  );
  await user.click(screen.getByRole("button", { name: "Salvar área" }));
  expect(await screen.findByRole("alert")).toBeInTheDocument();
  expect(screen.getByLabelText(/Nome da área/)).toHaveValue(name);
  expect(screen.getByLabelText(/Descrição da área/)).toHaveValue(
    "Descrição preservada",
  );
  await user.click(screen.getByRole("button", { name: "Salvar área" }));
  expect(await screen.findByRole("heading", { name })).toBeInTheDocument();
});

it("não fecha um novo formulário quando uma gravação anterior termina", async () => {
  let resolveFirst!: (value: { data: AreaOfExpertise }) => void;
  const firstPost = new Promise<{ data: AreaOfExpertise }>((resolve) => {
    resolveFirst = resolve;
  });
  let postCount = 0;
  mockedApi.post.mockImplementation(
    (url: string, body: { name: string; description: string }) => {
      if (url !== "/areas-of-expertise")
        return Promise.reject(new Error(`unexpected POST ${url}`));
      postCount += 1;
      if (postCount === 1) return firstPost;
      const created: AreaOfExpertise = {
        ...body,
        id: "area-second",
        createdAt: ts,
        updatedAt: ts,
      };
      areas = [...areas, created];
      return Promise.resolve({ data: created });
    },
  );
  const user = setup();
  await screen.findByRole("heading", { name: "Administração de produto" });
  await user.click(screen.getByRole("button", { name: "Cadastrar área" }));
  await user.type(screen.getByLabelText(/Nome da área/), "Primeira área");
  await user.type(
    screen.getByLabelText(/Descrição da área/),
    "Primeira descrição",
  );
  await user.click(screen.getByRole("button", { name: "Salvar área" }));
  await screen.findByRole("button", { name: "Salvando..." });
  await user.click(screen.getByRole("button", { name: "Fechar janela" }));
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
  );
  await user.click(screen.getByRole("button", { name: "Cadastrar área" }));
  await user.type(
    screen.getByLabelText(/Nome da área/),
    "Meu próximo rascunho",
  );
  await act(async () => {
    resolveFirst({
      data: {
        id: "area-first",
        name: "Primeira área",
        description: "Primeira descrição",
        createdAt: ts,
        updatedAt: ts,
      },
    });
  });
  await screen.findByText("Área cadastrada com sucesso.");
  expect(screen.getByRole("dialog")).toHaveAttribute("data-state", "open");
  expect(screen.getByLabelText(/Nome da área/)).toHaveValue(
    "Meu próximo rascunho",
  );
});
