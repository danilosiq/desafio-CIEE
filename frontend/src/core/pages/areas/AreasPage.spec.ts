import { createElement } from "react";
import { randomUUID } from "node:crypto";
import { createServer, request as nodeRequest, type Server } from "node:http";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AreasPage } from "./AreasPage";
import { api } from "@/core/services/Api";

const suffix = randomUUID();
const areaName = `Design de produto ${suffix}`;
const createdName = `Educação ${suffix}`;
let linkedResumeId: string;
let environmentVerified = false;
const realApiUrl = "http://127.0.0.1:3335";
function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    createElement(QueryClientProvider, { client }, createElement(AreasPage)),
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
  environmentVerified = true;
  await api.post("/areas-of-expertise", {
    name: areaName,
    description: "Área fictícia",
  });
});
afterAll(async () => {
  if (!environmentVerified) return;
  api.defaults.baseURL = realApiUrl;
  if (linkedResumeId) await api.delete(`/resumes/${linkedResumeId}`);
  const { data } = await api.get<Array<{ id: string; name: string }>>(
    "/areas-of-expertise",
  );
  for (const area of data.filter((item) => item.name.includes(suffix)))
    await api.delete(`/areas-of-expertise/${area.id}`);
});
afterEach(() => {
  api.defaults.baseURL = realApiUrl;
});
it("lista, pesquisa e recupera o estado vazio", async () => {
  const user = setup();
  await screen.findByRole("heading", { name: areaName });
  await user.type(
    screen.getByLabelText("Buscar áreas de atuação"),
    `Nada ${suffix}`,
  );
  expect(screen.getByText("Nenhuma área encontrada")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Limpar pesquisa" }));
  expect(screen.getByRole("heading", { name: areaName })).toBeInTheDocument();
});
it("valida nome/descrição e cria uma categoria real", async () => {
  const user = setup();
  await user.click(screen.getByRole("button", { name: "Cadastrar área" }));
  await user.click(screen.getByRole("button", { name: "Salvar área" }));
  expect(
    await screen.findByText("Informe o nome da área."),
  ).toBeInTheDocument();
  expect(screen.getByText("Informe a descrição da área.")).toBeInTheDocument();
  await user.type(screen.getByLabelText(/Nome da área/), createdName);
  await user.type(
    screen.getByLabelText(/Descrição da área/),
    "Projetos educacionais",
  );
  await user.click(screen.getByRole("button", { name: "Salvar área" }));
  expect(
    await screen.findByRole("heading", { name: createdName }),
  ).toBeInTheDocument();
  expect((await api.get("/areas-of-expertise")).data).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        name: createdName,
        description: "Projetos educacionais",
      }),
    ]),
  );
});
it("consulta detalhes, permite cancelar exclusão e explica o bloqueio de uma área vinculada", async () => {
  const linkedName = `Área vinculada ${suffix}`;
  const linkedArea = await api.post("/areas-of-expertise", {
    name: linkedName,
    description: "Área vinculada ao candidato",
  });
  const linkedResume = await api.post("/resumes", {
    fullName: "Pessoa Vinculada",
    email: `vinculado.${suffix}@example.com`,
    areaOfExpertise: linkedName,
    areaOfExpertiseId: linkedArea.data.id,
  });
  linkedResumeId = linkedResume.data.id;
  const user = setup();
  await user.click(
    await screen.findByRole("button", { name: `Consultar área ${linkedName}` }),
  );
  expect(
    await screen.findByRole("dialog", { name: "Detalhes da área de atuação" }),
  ).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Fechar" }));
  await user.click(
    await screen.findByRole("button", { name: `Excluir área ${linkedName}` }),
  );
  await user.click(screen.getByRole("button", { name: "Cancelar" }));
  await user.click(
    await screen.findByRole("button", { name: `Excluir área ${linkedName}` }),
  );
  await user.click(screen.getByRole("button", { name: "Confirmar exclusão" }));
  expect(
    await screen.findByText(
      /Área vinculada a candidatos não pode ser excluída/,
    ),
  ).toBeInTheDocument();
  expect(
    (await api.get(`/areas-of-expertise/${linkedArea.data.id}`)).status,
  ).toBe(200);
});
it("trata falha na consulta e permite tentar novamente", async () => {
  api.defaults.baseURL = "http://127.0.0.1:1";
  const user = setup();
  expect(
    await screen.findByText("Não foi possível carregar as áreas de atuação."),
  ).toBeInTheDocument();
  api.defaults.baseURL = realApiUrl;
  await user.click(screen.getByRole("button", { name: "Tentar novamente" }));
  expect(
    await screen.findByRole("heading", { name: areaName }),
  ).toBeInTheDocument();
});
it("preserva formulário após falha na operação e permite tentar novamente", async () => {
  const user = setup();
  await screen.findByRole("heading", { name: areaName });
  await user.click(screen.getByRole("button", { name: "Cadastrar área" }));
  const name = `Categoria após falha ${suffix}`;
  await user.type(screen.getByLabelText(/Nome da área/), name);
  await user.type(
    screen.getByLabelText(/Descrição da área/),
    "Descrição preservada",
  );
  api.defaults.baseURL = "http://127.0.0.1:1";
  await user.click(screen.getByRole("button", { name: "Salvar área" }));
  expect(await screen.findByRole("alert")).toBeInTheDocument();
  expect(screen.getByLabelText(/Nome da área/)).toHaveValue(name);
  expect(screen.getByLabelText(/Descrição da área/)).toHaveValue(
    "Descrição preservada",
  );
  api.defaults.baseURL = realApiUrl;
  await user.click(screen.getByRole("button", { name: "Salvar área" }));
  expect(await screen.findByRole("heading", { name })).toBeInTheDocument();
});
it("não fecha um novo formulário quando uma gravação anterior termina", async () => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let server: Server | undefined;
  const pendingPosts: Promise<void>[] = [];
  try {
    server = createServer((req, res) => {
      if (req.method === "POST") {
        pendingPosts.push(
          new Promise<void>((resolve) => {
            res.once("finish", resolve);
            res.once("close", resolve);
          }),
        );
      }
      const upstream = nodeRequest(
        `${realApiUrl}${req.url}`,
        {
          method: req.method,
          headers: { ...req.headers, host: "127.0.0.1:3335" },
        },
        (response) => {
          const send = () => {
            res.writeHead(response.statusCode || 500, response.headers);
            response.pipe(res);
          };
          if (req.method === "POST") void gate.then(send);
          else send();
        },
      );
      req.pipe(upstream);
    });
    await new Promise<void>((resolve) =>
      server!.listen(0, "127.0.0.1", resolve),
    );
    const address = server.address();
    if (!address || typeof address === "string")
      throw new Error("Proxy indisponível");
    api.defaults.baseURL = `http://127.0.0.1:${address.port}`;
    const user = setup();
    await screen.findByRole("heading", { name: areaName });
    await user.click(screen.getByRole("button", { name: "Cadastrar área" }));
    await user.type(
      screen.getByLabelText(/Nome da área/),
      `Primeira área ${suffix}`,
    );
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
      release();
    });
    await screen.findByText("Área cadastrada com sucesso.");
    expect(screen.getByRole("dialog")).toHaveAttribute("data-state", "open");
    expect(screen.getByLabelText(/Nome da área/)).toHaveValue(
      "Meu próximo rascunho",
    );
  } finally {
    release();
    await Promise.allSettled(pendingPosts);
    api.defaults.baseURL = realApiUrl;
    server?.close();
  }
});
