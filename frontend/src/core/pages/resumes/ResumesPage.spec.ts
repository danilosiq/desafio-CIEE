import { createElement } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { api } from "@/core/services/Api";
import { ResumesPage } from "./ResumesPage";

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

const ana = {
  id: "ana-pereira",
  fullName: "Ana Pereira",
  email: "ana.pereira@example.com",
  phone: "(11) 98765-4321",
  areaOfExpertise: "Design de produto",
  areaOfExpertiseId: "design",
  professionalSummary: "Designer.",
  createdAt: "2026-11-04T12:00:00.000Z",
  updatedAt: "2026-11-04T12:00:00.000Z",
};
const lucas = {
  id: "lucas-oliveira",
  fullName: "Lucas Oliveira",
  email: "lucas.oliveira@example.com",
  phone: "(11) 97654-3210",
  areaOfExpertise: "Desenvolvimento frontend",
  areaOfExpertiseId: "frontend",
  professionalSummary: "Dev.",
  createdAt: "2026-11-03T14:00:00.000Z",
  updatedAt: "2026-11-05T14:00:00.000Z",
};

function page(items: (typeof ana)[]) {
  return {
    data: { items, page: 1, limit: 30, total: items.length, totalPages: 1 },
  };
}

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    createElement(QueryClientProvider, { client }, createElement(ResumesPage)),
  );
  return userEvent.setup();
}

beforeEach(() => {
  jest.clearAllMocks();
  mockedApi.get.mockImplementation((url: string) => {
    if (url === "/resumes") return Promise.resolve(page([ana, lucas]));
    return Promise.reject(new Error(`unexpected GET ${url}`));
  });
});

afterEach(() => jest.restoreAllMocks());

it("mostra carregamento e depois os candidatos", async () => {
  setup();
  expect(screen.getByText("Carregando cadastros...")).toBeInTheDocument();
  expect(
    await screen.findByRole("link", { name: "Ana Pereira" }),
  ).toBeInTheDocument();
});

it("encontra candidato sem considerar acentos ou maiúsculas", async () => {
  const user = setup();
  await screen.findByRole("link", { name: "Ana Pereira" });
  await user.type(screen.getByLabelText("Buscar candidatos"), "ANA PEREIRA");
  expect(screen.getByRole("link", { name: "Ana Pereira" })).toBeInTheDocument();
  expect(
    screen.queryByRole("link", { name: "Lucas Oliveira" }),
  ).not.toBeInTheDocument();
});

it("filtra por nome e apresenta estado vazio com recuperação", async () => {
  const user = setup();
  await screen.findByRole("link", { name: "Ana Pereira" });
  await user.type(screen.getByLabelText("Buscar candidatos"), "Ninguém");
  expect(screen.getByText("Nenhum candidato encontrado")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Limpar filtros" }));
  expect(screen.getByRole("link", { name: "Ana Pereira" })).toBeInTheDocument();
});

it("substitui o filtro de áreas por um menu de ordenação alfabética", async () => {
  const user = setup();
  await screen.findByRole("link", { name: "Ana Pereira" });
  expect(screen.queryByLabelText("Filtrar por área")).not.toBeInTheDocument();
  await user.click(
    screen.getByRole("button", { name: "Organizar candidatos" }),
  );
  expect(screen.getByLabelText("Organizar por")).toHaveValue("alphabetical");
  expect(
    screen
      .getAllByTestId("resume-item")
      .map((item) => item.getAttribute("aria-label")),
  ).toEqual(["Ana Pereira", "Lucas Oliveira"]);
});

it("organiza pela última alteração em ambas as direções, sem perder a busca ou a visualização", async () => {
  const user = setup();
  await screen.findByRole("link", { name: "Ana Pereira" });
  await user.click(
    screen.getByRole("button", { name: "Organizar candidatos" }),
  );
  await user.selectOptions(screen.getByLabelText("Organizar por"), "newest");
  await waitFor(() =>
    expect(
      screen
        .getAllByTestId("resume-item")
        .map((item) => item.getAttribute("aria-label")),
    ).toEqual(["Lucas Oliveira", "Ana Pereira"]),
  );
  await user.selectOptions(screen.getByLabelText("Organizar por"), "oldest");
  await waitFor(() =>
    expect(
      screen
        .getAllByTestId("resume-item")
        .map((item) => item.getAttribute("aria-label")),
    ).toEqual(["Ana Pereira", "Lucas Oliveira"]),
  );
  await user.keyboard("{Escape}");
  await user.clear(screen.getByLabelText("Buscar candidatos"));
  await user.type(screen.getByLabelText("Buscar candidatos"), "Ana Pereira");
  await user.click(screen.getByRole("button", { name: "Visualizar em cards" }));
  expect(screen.getAllByTestId("resume-item")).toHaveLength(1);
  expect(screen.getByLabelText("Buscar candidatos")).toHaveValue("Ana Pereira");
});

it.each(["list", "grid"] as const)(
  "torna toda a superfície do item navegável em %s",
  async (view) => {
    const user = setup();
    await screen.findByRole("link", { name: "Ana Pereira" });
    if (view === "list")
      await user.click(
        screen.getByRole("button", { name: "Visualizar em lista" }),
      );
    expect(screen.getByText(ana.email).closest("a")).toHaveAttribute(
      "href",
      `/candidatos/${ana.id}`,
    );
    expect(
      screen.queryByRole("link", { name: "Ver detalhes de Ana Pereira" }),
    ).not.toBeInTheDocument();
  },
);

it("trata falha no limite da API e permite repetir a consulta", async () => {
  mockedApi.get.mockReset();
  mockedApi.get
    .mockRejectedValueOnce(new Error("network"))
    .mockResolvedValueOnce(page([ana, lucas]));
  const user = setup();
  expect(
    await screen.findByText("Não foi possível carregar os cadastros."),
  ).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Tentar novamente" }));
  expect(
    await screen.findByRole("link", { name: "Ana Pereira" }),
  ).toBeInTheDocument();
});

it("alterna entre lista e cards preservando a pesquisa", async () => {
  const user = setup();
  await screen.findByRole("link", { name: "Ana Pereira" });
  await user.type(screen.getByLabelText("Buscar candidatos"), "Ana Pereira");
  expect(
    screen.getByRole("button", { name: "Visualizar em cards" }),
  ).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("link", { name: "Ana Pereira" })).toBeInTheDocument();
  expect(
    screen.queryByRole("link", { name: "Lucas Oliveira" }),
  ).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Visualizar em lista" }));
  expect(screen.getByLabelText("Buscar candidatos")).toHaveValue("Ana Pereira");
});

it("usa cards como visualização efetiva no celular", async () => {
  const descriptor = Object.getOwnPropertyDescriptor(window, "matchMedia");
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: (query: string) => ({
      matches: query === "(width < 40rem)",
      addEventListener() {},
      removeEventListener() {},
    }),
  });
  try {
    setup();
    await screen.findByRole("link", { name: "Ana Pereira" });
    expect(screen.getByTestId("resume-collection")).toHaveAttribute(
      "data-view",
      "grid",
    );
  } finally {
    if (descriptor) Object.defineProperty(window, "matchMedia", descriptor);
    else Reflect.deleteProperty(window, "matchMedia");
  }
});
