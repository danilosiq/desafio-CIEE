import { createElement } from "react";
import { randomUUID } from "node:crypto";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { api } from "@/core/services/Api";
import { ResumesPage } from "./ResumesPage";

const suffix = randomUUID();
const ana = `Ana Pereira ${suffix}`;
const lucas = `Lucas Oliveira ${suffix}`;
const email = `ana.${suffix}@example.com`;
const realApiUrl = "http://127.0.0.1:3335";
const ids: string[] = [];
function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    createElement(QueryClientProvider, { client }, createElement(ResumesPage)),
  );
  return userEvent.setup();
}
beforeAll(async () => {
  if (
    process.env.FRONTEND_TEST_DATABASE !== "ciee_test" ||
    process.env.NEXT_PUBLIC_API_URL !== realApiUrl
  )
    throw new Error(
      "Execute com a API isolada e FRONTEND_TEST_DATABASE=ciee_test.",
    );
  const first = await api.post("/resumes", {
    fullName: ana,
    email,
    phone: "11987654321",
  });
  ids.push(first.data.id);
  await new Promise((resolve) => setTimeout(resolve, 25));
  const second = await api.post("/resumes", {
    fullName: lucas,
    email: `lucas.${suffix}@example.com`,
    phone: "11976543210",
  });
  ids.push(second.data.id);
});
afterAll(async () => {
  api.defaults.baseURL = realApiUrl;
  for (const id of ids) await api.delete(`/resumes/${id}`);
});
afterEach(() => {
  api.defaults.baseURL = realApiUrl;
});
it("mostra carregamento e depois os candidatos", async () => {
  setup();
  expect(screen.getByText("Carregando cadastros...")).toBeInTheDocument();
  expect(await screen.findByRole("link", { name: ana })).toBeInTheDocument();
});
it("filtra por nome e apresenta estado vazio com recuperação", async () => {
  const user = setup();
  await screen.findByRole("link", { name: ana });
  await user.type(
    screen.getByLabelText("Buscar candidatos"),
    `Ninguém ${suffix}`,
  );
  expect(screen.getByText("Nenhum candidato encontrado")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Limpar filtros" }));
  expect(screen.getByRole("link", { name: ana })).toBeInTheDocument();
});
it("substitui o filtro de áreas por um menu de ordenação alfabética", async () => {
  const user = setup();
  await screen.findByRole("link", { name: ana });
  await user.type(screen.getByLabelText("Buscar candidatos"), suffix);
  expect(screen.queryByLabelText("Filtrar por área")).not.toBeInTheDocument();
  await user.click(
    screen.getByRole("button", { name: "Organizar candidatos" }),
  );
  expect(screen.getByLabelText("Organizar por")).toHaveValue("alphabetical");
  expect(
    screen
      .getAllByTestId("resume-item")
      .map((item) => item.getAttribute("aria-label")),
  ).toEqual([ana, lucas]);
});
it("organiza pela última alteração em ambas as direções, sem perder a busca ou a visualização", async () => {
  const user = setup();
  await screen.findByRole("link", { name: ana });
  await user.type(screen.getByLabelText("Buscar candidatos"), suffix);
  await user.click(
    screen.getByRole("button", { name: "Organizar candidatos" }),
  );
  await user.selectOptions(screen.getByLabelText("Organizar por"), "newest");
  await waitFor(() =>
    expect(
      screen
        .getAllByTestId("resume-item")
        .map((item) => item.getAttribute("aria-label")),
    ).toEqual([lucas, ana]),
  );
  await user.selectOptions(screen.getByLabelText("Organizar por"), "oldest");
  await waitFor(() =>
    expect(
      screen
        .getAllByTestId("resume-item")
        .map((item) => item.getAttribute("aria-label")),
    ).toEqual([ana, lucas]),
  );
  await user.keyboard("{Escape}");
  await user.clear(screen.getByLabelText("Buscar candidatos"));
  await user.type(screen.getByLabelText("Buscar candidatos"), ana);
  await user.click(screen.getByRole("button", { name: "Visualizar em cards" }));
  expect(screen.getAllByTestId("resume-item")).toHaveLength(1);
  expect(screen.getByLabelText("Buscar candidatos")).toHaveValue(ana);
});
it.each(["list", "grid"] as const)(
  "torna toda a superfície do item navegável em %s",
  async (view) => {
    const user = setup();
    await screen.findByRole("link", { name: ana });
    if (view === "grid")
      await user.click(
        screen.getByRole("button", { name: "Visualizar em cards" }),
      );
    expect(screen.getByText(email).closest("a")).toHaveAttribute(
      "href",
      `/candidatos/${ids[0]}`,
    );
    expect(
      screen.queryByRole("link", { name: `Ver detalhes de ${ana}` }),
    ).not.toBeInTheDocument();
  },
);
it("trata falha no limite da API e permite repetir a consulta", async () => {
  api.defaults.baseURL = "http://127.0.0.1:1";
  const user = setup();
  expect(
    await screen.findByText("Não foi possível carregar os cadastros."),
  ).toBeInTheDocument();
  api.defaults.baseURL = realApiUrl;
  await user.click(screen.getByRole("button", { name: "Tentar novamente" }));
  expect(await screen.findByRole("link", { name: ana })).toBeInTheDocument();
});
it("alterna entre lista e cards preservando a pesquisa", async () => {
  const user = setup();
  await screen.findByRole("link", { name: ana });
  await user.type(screen.getByLabelText("Buscar candidatos"), ana);
  await user.click(screen.getByRole("button", { name: "Visualizar em cards" }));
  expect(
    screen.getByRole("button", { name: "Visualizar em cards" }),
  ).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("link", { name: ana })).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: lucas })).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Visualizar em lista" }));
  expect(screen.getByLabelText("Buscar candidatos")).toHaveValue(ana);
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
    await screen.findByRole("link", { name: ana });
    expect(screen.getByTestId("resume-collection")).toHaveAttribute(
      "data-view",
      "grid",
    );
  } finally {
    if (descriptor) Object.defineProperty(window, "matchMedia", descriptor);
    else Reflect.deleteProperty(window, "matchMedia");
  }
});
