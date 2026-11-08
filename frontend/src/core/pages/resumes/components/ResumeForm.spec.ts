import { createElement } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ResumeForm } from "./ResumeForm";
import { makeTextPdf } from "../../../../../../backend/tests/fixtures/MakeTextPdf";
import {
  createResume,
  deleteResume,
  getResume,
} from "@/core/services/ResumeService";
import { createArea, deleteArea } from "@/core/services/AreaService";
import type { Resume } from "@/core/types/Resume";
import type { AreaOfExpertise } from "@/core/types/AreaOfExpertise";

let area: AreaOfExpertise;
let duplicate: Resume;
const createdIds: string[] = [];
const runId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
beforeAll(async () => {
  if (
    process.env.NEXT_PUBLIC_API_URL !== "http://127.0.0.1:3335" ||
    process.env.FRONTEND_TEST_DATABASE !== "ciee_test"
  ) {
    throw new Error(
      "Execute os testes com API isolada em 127.0.0.1:3335 e FRONTEND_TEST_DATABASE=ciee_test.",
    );
  }
  area = await createArea({
    data: { name: `Design teste ${runId}`, description: "Área fictícia" },
  });
  duplicate = await createResume({
    data: {
      fullName: "Pessoa Duplicada",
      email: `duplicado-${runId}@example.com`,
      phone: "",
      areaOfExpertise: "",
      professionalSummary: "",
    },
  });
});
afterAll(async () => {
  for (const id of [...createdIds, duplicate?.id].filter(Boolean))
    await deleteResume({ id });
  if (area) await deleteArea({ id: area.id });
});
const SCAN_FIXTURE_NAMES = {
  success: "curriculo-exemplo.pdf",
  partial: "fixture-leitura-parcial.pdf",
  error: "fixture-falha-leitura.pdf",
} as const;
async function uploadPdf(
  user: ReturnType<typeof userEvent.setup>,
  scenario: keyof typeof SCAN_FIXTURE_NAMES = "success",
) {
  await user.upload(
    screen.getByLabelText("Selecionar currículo em PDF"),
    new File(
      [
        scenario === "error"
          ? new TextEncoder().encode("%PDF-1.4\ncorrompido").buffer
          : new Uint8Array(
              makeTextPdf(
                scenario === "partial"
                  ? ["camila.rocha@example.com"]
                  : [
                      "Camila Rocha",
                      "camila.rocha@example.com",
                      "(11) 99999-1234",
                    ],
              ),
            ).buffer,
      ],
      SCAN_FIXTURE_NAMES[scenario],
      {
        type: "application/pdf",
      },
    ),
  );
}
function setup(props: Parameters<typeof ResumeForm>[0] = {}) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const user = userEvent.setup();
  render(
    createElement(
      QueryClientProvider,
      { client },
      createElement(ResumeForm, {
        ...props,
        onSaved: (candidate: Resume) => {
          createdIds.push(candidate.id);
          props.onSaved?.(candidate);
        },
      }),
    ),
  );
  return user;
}
beforeEach(() => {
  localStorage.clear();
});
it("apresenta os cinco campos e o PDF opcional", () => {
  setup();
  for (const label of [
    /Nome completo/,
    /E-mail/,
    /Telefone/,
    /Área de atuação/,
    /Resumo profissional/,
  ])
    expect(screen.getByLabelText(label)).toBeInTheDocument();
  expect(screen.getByLabelText(/Selecionar currículo/)).toBeInTheDocument();
});
it("apresenta validação sem perder o preenchimento", async () => {
  const user = setup();
  await user.type(screen.getByLabelText(/Telefone/), "11999999999");
  await user.click(screen.getByRole("button", { name: "Confirmar dados" }));
  expect(
    await screen.findByText("Informe o nome completo."),
  ).toBeInTheDocument();
  expect(screen.getByLabelText(/Telefone/)).toHaveValue("(11) 99999-9999");
});

it("salva manualmente e informa sucesso", async () => {
  const user = setup();
  await user.type(screen.getByLabelText(/Nome completo/), "Pessoa Teste");
  await user.type(
    screen.getByLabelText(/E-mail/),
    `pessoa-${runId}@example.com`,
  );
  await user.click(screen.getByRole("button", { name: "Confirmar dados" }));
  expect(
    await screen.findByText("Cadastro salvo com sucesso."),
  ).toBeInTheDocument();
});
it("oferece atualização para e-mail já cadastrado", async () => {
  const user = setup();
  await user.type(screen.getByLabelText(/Nome completo/), "Pessoa Teste");
  await user.type(screen.getByLabelText(/E-mail/), duplicate.email);
  await user.click(screen.getByRole("button", { name: "Confirmar dados" }));
  expect(
    await screen.findByRole("link", { name: /Editar cadastro existente/ }),
  ).toHaveAttribute("href", `/candidatos/${duplicate.id}/editar`);
  expect(screen.getByLabelText(/Nome completo/)).toHaveValue("Pessoa Teste");
});
it("preenche com PDF e preserva campos já editados", async () => {
  const user = setup();
  await user.type(screen.getByLabelText(/Nome completo/), "Meu nome revisado");
  await uploadPdf(user);
  await user.click(screen.getByRole("button", { name: "Processar dados" }));
  await waitFor(() =>
    expect(screen.getByLabelText(/E-mail/)).toHaveValue(
      "camila.rocha@example.com",
    ),
  );
  expect(screen.getByLabelText(/Nome completo/)).toHaveValue(
    "Meu nome revisado",
  );
  expect(screen.getByLabelText(/E-mail/)).toHaveValue(
    "camila.rocha@example.com",
  );
});
it("não bloqueia preenchimento manual após falha na leitura", async () => {
  const user = setup();
  {
    await uploadPdf(user, "error");
    await user.click(screen.getByRole("button", { name: "Processar dados" }));
    await screen.findByText(/Não foi possível ler este PDF/);
    await user.type(
      screen.getByLabelText(/Nome completo/),
      "Manual Após Falha",
    );
    await user.type(
      screen.getByLabelText(/E-mail/),
      `manual-${Date.now()}@example.com`,
    );
    await user.click(screen.getByRole("button", { name: "Confirmar dados" }));
    expect(
      await screen.findByText("Cadastro salvo com sucesso."),
    ).toBeInTheDocument();
  }
});
it("permite completar os campos não encontrados", async () => {
  const user = setup();
  await uploadPdf(user, "partial");
  await user.click(screen.getByRole("button", { name: "Processar dados" }));
  await waitFor(() =>
    expect(screen.getByLabelText(/E-mail/)).toHaveValue(
      "camila.rocha@example.com",
    ),
  );
  expect(screen.getByLabelText(/Nome completo/)).toHaveValue("");
  expect(screen.getByLabelText(/Telefone/)).toHaveValue("");
  expect(screen.getByLabelText(/E-mail/)).toHaveValue(
    "camila.rocha@example.com",
  );
});
it("remove o PDF sem bloquear o formulário", async () => {
  const user = setup();
  await user.upload(
    screen.getByLabelText(/Selecionar currículo/),
    new File(["texto"], "cv.pdf", { type: "application/pdf" }),
  );
  await user.click(screen.getByRole("button", { name: "Remover PDF" }));
  expect(screen.getByLabelText(/Nome completo/)).toBeEnabled();
});

it("formata automaticamente o telefone enquanto a pessoa digita", async () => {
  const user = setup();
  await user.type(screen.getByLabelText(/Telefone/), "11987654321");
  expect(screen.getByLabelText(/Telefone/)).toHaveValue("(11) 98765-4321");
});

it("separa seleção e revisão no fluxo móvel por PDF", async () => {
  const descriptor = Object.getOwnPropertyDescriptor(window, "matchMedia");
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: (query: string) => ({
      matches: query === "(width < 40rem)",
      addEventListener: () => {},
      removeEventListener: () => {},
    }),
  });
  try {
    const user = setup({ mobileSteps: true });
    expect(screen.queryByText(/etapa \d de/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Nome completo/)).not.toBeInTheDocument();
    await uploadPdf(user);
    expect(screen.getByText("curriculo-exemplo.pdf")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Processar dados" }));
    expect(await screen.findByLabelText(/Nome completo/)).toHaveValue(
      "Camila Rocha",
    );
    expect(
      screen.queryByText("Revise os dados do candidato"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Leitura simulada concluída/),
    ).not.toBeInTheDocument();
    await user.clear(screen.getByLabelText(/Nome completo/));
    await user.type(screen.getByLabelText(/Nome completo/), "Nome revisado");
    await user.click(screen.getByRole("button", { name: "Voltar ao arquivo" }));
    await screen.findByRole("button", { name: "Processar dados" });
    await user.click(screen.getByRole("button", { name: "Processar dados" }));
    expect(await screen.findByLabelText(/Nome completo/)).toHaveValue(
      "Nome revisado",
    );
  } finally {
    if (descriptor) Object.defineProperty(window, "matchMedia", descriptor);
    else Reflect.deleteProperty(window, "matchMedia");
  }
});
it("limpa os dados preenchidos sem salvar um cadastro", async () => {
  const user = setup();
  await user.type(screen.getByLabelText(/Nome completo/), "Rascunho");
  await user.type(screen.getByLabelText(/E-mail/), "rascunho@example.com");
  await user.click(screen.getByRole("button", { name: "Limpar dados" }));
  expect(screen.getByLabelText(/Nome completo/)).toHaveValue("");
  expect(screen.getByLabelText(/E-mail/)).toHaveValue("");
  expect(
    screen.queryByText("Cadastro salvo com sucesso."),
  ).not.toBeInTheDocument();
});

it("oferece áreas do catálogo e libera texto livre ao escolher Outros", async () => {
  const user = setup();
  await screen.findByRole("option", { name: area.name });
  await user.selectOptions(screen.getByLabelText("Área de atuação"), area.id);
  expect(screen.getByLabelText("Área de atuação")).toHaveValue(area.id);
  expect(
    screen.queryByLabelText("Informe a área de atuação"),
  ).not.toBeInTheDocument();
  await user.selectOptions(screen.getByLabelText("Área de atuação"), "__other");
  await user.type(
    screen.getByLabelText("Informe a área de atuação"),
    "Operações educacionais",
  );
  expect(screen.getByLabelText("Informe a área de atuação")).toHaveValue(
    "Operações educacionais",
  );
});
it("não exibe atalhos de demonstração ou cabeçalho redundante na criação", () => {
  setup();
  expect(
    screen.queryByRole("button", { name: "Usar PDF de exemplo" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByText("Cenários da demonstração"),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Preencher manualmente" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByText("Informações do candidato"),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByText("Campos com * são obrigatórios."),
  ).not.toBeInTheDocument();
});

it("exige texto em Outros e não mistura texto livre com uma categoria selecionada", async () => {
  const user = setup();
  await screen.findByRole("option", { name: area.name });
  await user.type(screen.getByLabelText(/Nome completo/), "Novo candidato");
  await user.type(
    screen.getByLabelText(/E-mail/),
    `outros-${runId}@example.com`,
  );
  await user.selectOptions(screen.getByLabelText("Área de atuação"), "__other");
  await user.type(screen.getByLabelText("Informe a área de atuação"), "   ");
  await user.click(screen.getByRole("button", { name: "Confirmar dados" }));
  expect(
    await screen.findByText("Informe a área de atuação."),
  ).toBeInTheDocument();
  const option = screen.getByRole("option", {
    name: area.name,
  }) as HTMLOptionElement;
  await user.selectOptions(
    screen.getByLabelText("Área de atuação"),
    option.value,
  );
  expect(
    screen.queryByLabelText("Informe a área de atuação"),
  ).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Confirmar dados" }));
  expect(
    await screen.findByText("Cadastro salvo com sucesso."),
  ).toBeInTheDocument();
  const saved = await getResume({ id: createdIds[createdIds.length - 1] });
  expect(saved.areaOfExpertiseId).toBe(area.id);
  expect(saved.areaOfExpertise).toBe(area.name);
});
