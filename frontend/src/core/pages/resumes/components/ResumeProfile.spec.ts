import { createElement } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ResumeProfile } from "./ResumeProfile";
import { resumeFixtures } from "@/mocks/ResumeFixtures";
import { api } from "@/core/services/Api";
import { resetMockData } from "@/mocks/MockApi";
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
afterEach(() => jest.restoreAllMocks());
beforeEach(() => {
  localStorage.clear();
  resetMockData();
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
  await screen.findByRole("option", { name: "Design de produto" });
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
  const failure = jest
    .spyOn(api, "get")
    .mockRejectedValueOnce(new Error("indisponível"));
  setup();
  await screen.findByText(
    "Não foi possível listar as áreas. Você pode usar Outros.",
  );
  expect(
    screen.getByRole("option", { name: "Design de produto" }),
  ).toBeInTheDocument();
  expect(screen.getByLabelText("Área de atuação")).toHaveValue("design");
  failure.mockRestore();
});
