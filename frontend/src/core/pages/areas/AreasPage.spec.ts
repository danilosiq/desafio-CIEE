import { createElement } from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AreasPage } from "./AreasPage";
import { resetMockData } from "@/mocks/MockApi";
import { api } from "@/core/services/Api";
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
  localStorage.clear();
  resetMockData();
});
afterEach(() => jest.restoreAllMocks());
it("lista, pesquisa e recupera o estado vazio", async () => {
  const user = setup();
  await screen.findByRole("heading", { name: "Design de produto" });
  await user.type(
    screen.getByLabelText("Buscar áreas de atuação"),
    "Nada com esse nome",
  );
  expect(screen.getByText("Nenhuma área encontrada")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Limpar pesquisa" }));
  expect(
    screen.getByRole("heading", { name: "Design de produto" }),
  ).toBeInTheDocument();
});
it("valida nome/descrição e cria uma categoria", async () => {
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
});
it("consulta detalhes, permite cancelar exclusão e explica o bloqueio de uma área vinculada", async () => {
  const user = setup();
  await user.click(
    await screen.findByRole("button", {
      name: "Consultar área Design de produto",
    }),
  );
  expect(
    await screen.findByRole("dialog", { name: "Detalhes da área de atuação" }),
  ).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Fechar" }));
  await user.click(
    await screen.findByRole("button", {
      name: "Excluir área Design de produto",
    }),
  );
  await user.click(screen.getByRole("button", { name: "Cancelar" }));
  await user.click(
    await screen.findByRole("button", {
      name: "Excluir área Design de produto",
    }),
  );
  await user.click(screen.getByRole("button", { name: "Confirmar exclusão" }));
  expect(
    await screen.findByText(/Esta área possui candidatos vinculados/),
  ).toBeInTheDocument();
});
it("trata falha na consulta e permite tentar novamente", async () => {
  jest.spyOn(api, "get").mockRejectedValueOnce(new Error("Indisponível"));
  const user = setup();
  expect(
    await screen.findByText("Não foi possível carregar as áreas de atuação."),
  ).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Tentar novamente" }));
  expect(
    await screen.findByRole("heading", { name: "Design de produto" }),
  ).toBeInTheDocument();
});
it("preserva o formulário após falha na operação e permite tentar novamente", async () => {
  jest.spyOn(api, "post").mockRejectedValueOnce(new Error("Indisponível"));
  const user = setup();
  await user.click(screen.getByRole("button", { name: "Cadastrar área" }));
  await user.type(
    screen.getByLabelText(/Nome da área/),
    "Categoria após falha",
  );
  await user.type(
    screen.getByLabelText(/Descrição da área/),
    "Descrição preservada",
  );
  await user.click(screen.getByRole("button", { name: "Salvar área" }));
  expect(await screen.findByRole("alert")).toBeInTheDocument();
  expect(screen.getByLabelText(/Nome da área/)).toHaveValue(
    "Categoria após falha",
  );
  expect(screen.getByLabelText(/Descrição da área/)).toHaveValue(
    "Descrição preservada",
  );
  await user.click(screen.getByRole("button", { name: "Salvar área" }));
  expect(
    await screen.findByRole("heading", { name: "Categoria após falha" }),
  ).toBeInTheDocument();
});

it("não fecha um novo formulário quando uma gravação anterior termina", async () => {
  let finish!: () => void;
  const pending = new Promise<void>((resolve) => {
    finish = resolve;
  });
  const originalPost = api.post.bind(api);
  jest.spyOn(api, "post").mockImplementationOnce(async (...args) => {
    await pending;
    return originalPost(...args);
  });
  const user = setup();
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
    finish();
    await pending;
  });
  await screen.findByText("Área cadastrada com sucesso.");
  expect(screen.getByRole("dialog")).toHaveAttribute("data-state", "open");
  expect(screen.getByLabelText(/Nome da área/)).toHaveValue(
    "Meu próximo rascunho",
  );
});
