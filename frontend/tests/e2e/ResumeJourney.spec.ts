import { makeTextPdf } from "../../../backend/tests/fixtures/MakeTextPdf";
import { mkdir } from "node:fs/promises";
const SCAN_FIXTURE_NAMES = {
  success: "curriculo-exemplo.pdf",
  partial: "fixture-leitura-parcial.pdf",
  error: "fixture-falha-leitura.pdf",
} as const;
import {
  chromium,
  type Browser,
  type BrowserContext,
  type Page,
} from "playwright";
const baseURL = process.env.E2E_BASE_URL ?? "";
let browser: Browser;
let context: BrowserContext;
let page: Page;
let pageErrors: string[] = [];
let expectedHttpErrors = new Set<number>();
const apiURL = process.env.E2E_API_URL;
const runId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const designName = `Design de produto ${runId}`;
let areaId = "";
let anaId = "";
let lucasId = "";
let juliaId = "";
let createdResumes: string[] = [];
let createdAreas: string[] = [];
let pendingResponses: Promise<void>[] = [];
async function apiRequest(path: string, method = "GET", body?: object) {
  const response = await fetch(`${apiURL}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok && !(method === "DELETE" && response.status === 404))
    throw new Error(
      `${method} ${path}: ${response.status} ${await response.text()}`,
    );
  return response.status === 204 || response.status === 404
    ? null
    : response.json();
}
beforeAll(async () => {
  if (
    baseURL !== "http://127.0.0.1:3103" ||
    apiURL !== "http://127.0.0.1:3335" ||
    process.env.E2E_TEST_DATABASE !== "ciee_test"
  )
    throw new Error("O E2E exige frontend e API isolados com banco ciee_test.");
  const response = await fetch(baseURL);
  if (!response.ok)
    throw new Error(`Servidor E2E indisponível: HTTP ${response.status}`);
  browser = await chromium.launch({ headless: true });
  await mkdir("test-results", { recursive: true });
}, 60000);
beforeEach(async () => {
  createdResumes = [];
  createdAreas = [];
  pendingResponses = [];
  const area = await apiRequest("/areas-of-expertise", "POST", {
    name: designName,
    description: "Área fictícia de teste",
  });
  areaId = area.id;
  createdAreas.push(areaId);
  for (const [name, email] of [
    ["Júlia Almeida", `julia.almeida-${runId}@example.com`],
    ["Rafael Costa", `rafael.costa-${runId}@example.com`],
    ["Beatriz Santos", `beatriz.santos-${runId}@example.com`],
    ["Lucas Oliveira", `lucas.oliveira-${runId}@example.com`],
    ["Ana Pereira", `ana.pereira-${runId}@example.com`],
  ]) {
    const resume = await apiRequest("/resumes", "POST", {
      fullName: name,
      email,
      phone: "(11) 98765-4321",
      areaOfExpertiseId: name === "Ana Pereira" ? areaId : null,
      areaOfExpertise: "",
      professionalSummary: "Resumo fictício",
    });
    createdResumes.push(resume.id);
    if (name === "Ana Pereira") anaId = resume.id;
    if (name === "Lucas Oliveira") lucasId = resume.id;
    if (name === "Júlia Almeida") juliaId = resume.id;
  }
  context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  page = await context.newPage();
  expectedHttpErrors = new Set<number>();
  page.on("response", (response) => {
    if (response.status() >= 400 && !expectedHttpErrors.has(response.status()))
      pageErrors.push(`HTTP ${response.status()} ${response.url()}`);
    if (response.request().method() !== "POST" || !response.ok()) return;
    const path = new URL(response.url()).pathname;
    if (path !== "/resumes" && path !== "/areas-of-expertise") return;
    pendingResponses.push(
      response.json().then((created) => {
        if (path === "/resumes") createdResumes.push(created.id);
        else createdAreas.push(created.id);
      }),
    );
  });
  pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      !message.text().startsWith("Failed to load resource:")
    )
      pageErrors.push(message.text());
  });
});
afterEach(async () => {
  await Promise.all(pendingResponses);
  await context?.close();
  for (const id of [...new Set(createdResumes)])
    await apiRequest(`/resumes/${id}`, "DELETE");
  for (const id of [...new Set(createdAreas)])
    await apiRequest(`/areas-of-expertise/${id}`, "DELETE");
  expect(pageErrors).toEqual([]);
});
afterAll(async () => {
  await browser?.close();
});
async function openForm() {
  await page.goto(`${baseURL}/candidatos/novo`);
  await page.getByLabel("Nome completo", { exact: false }).waitFor();
}
async function fillManual(name: string, email: string) {
  await page.getByLabel("Nome completo", { exact: false }).fill(name);
  await page.getByLabel("E-mail", { exact: false }).fill(email);
}
async function chooseOtherArea(text: string) {
  await page
    .getByLabel("Área de atuação", { exact: true })
    .selectOption("__other");
  await page
    .getByLabel("Informe a área de atuação", { exact: true })
    .fill(text);
}
async function save() {
  await page
    .getByRole("button", { name: "Confirmar dados", exact: true })
    .click();
  await page.waitForURL(/\/candidatos\/[^/]+\?salvo=1$/);
  await page.getByText("Cadastro salvo com sucesso.").waitFor();
}
async function uploadPdf(
  scenario: keyof typeof SCAN_FIXTURE_NAMES = "success",
) {
  await page.getByLabel("Selecionar currículo em PDF").setInputFiles({
    name: SCAN_FIXTURE_NAMES[scenario],
    mimeType: "application/pdf",
    buffer:
      scenario === "error"
        ? Buffer.from("%PDF-1.4\ncorrompido")
        : makeTextPdf(
            scenario === "partial"
              ? [`camila.rocha-${runId}@example.com`]
              : [
                  "Camila Rocha",
                  `camila.rocha-${runId}@example.com`,
                  "(11) 99999-1234",
                ],
          ),
  });
  await page.mouse.move(0, 0);
  await page.waitForFunction(() => {
    const button = Array.from(document.querySelectorAll("button")).find(
      (element) => element.textContent?.trim() === "Escolher outro arquivo",
    );
    return (
      button && getComputedStyle(button).backgroundColor === "rgba(0, 0, 0, 0)"
    );
  });
}
async function sample(scenario: keyof typeof SCAN_FIXTURE_NAMES = "success") {
  await uploadPdf(scenario);
  await page.getByRole("button", { name: "Processar dados" }).click();
}
async function waitForRead() {
  await page.waitForFunction(
    (expected) =>
      (document.querySelector('input[name="email"]') as HTMLInputElement | null)
        ?.value === expected,
    `camila.rocha-${runId}@example.com`,
  );
}
it("consulta candidatos e recupera a listagem após pesquisa vazia", async () => {
  await page.goto(baseURL);
  await page.getByRole("link", { name: "Ana Pereira", exact: true }).waitFor();
  await page.screenshot({
    path: "test-results/HomeDesktop.png",
    fullPage: true,
  });
  await page.getByLabel("Buscar candidatos").fill("Pessoa inexistente");
  await page.getByText("Nenhum candidato encontrado").waitFor();
  await page.getByRole("button", { name: "Limpar filtros" }).click();
  await page.getByRole("link", { name: "Ana Pereira", exact: true }).click();
  await page
    .getByRole("heading", { name: "Ana Pereira", exact: true, level: 1 })
    .waitFor();
  expect(
    await page
      .getByRole("link", { name: `ana.pereira-${runId}@example.com` })
      .isVisible(),
  ).toBe(true);
});
it("valida, salva manualmente e permite consultar e editar sem PDF", async () => {
  await openForm();
  await page
    .getByRole("button", { name: "Confirmar dados", exact: true })
    .click();
  await page.getByText("Informe o nome completo.").waitFor();
  await fillManual("Marina Exemplo", "email-invalido");
  await page.getByLabel("Telefone", { exact: true }).fill("11999999999");
  await page
    .getByRole("button", { name: "Confirmar dados", exact: true })
    .click();
  await page.getByText("Informe um e-mail válido.").waitFor();
  expect(await page.getByLabel("Telefone", { exact: true }).inputValue()).toBe(
    "(11) 99999-9999",
  );
  await page
    .getByLabel("E-mail", { exact: false })
    .fill(`marina-${runId}@example.com`);
  await save();
  await page.reload();
  await page
    .getByRole("heading", { name: "Marina Exemplo", exact: true, level: 1 })
    .waitFor();
  await page
    .getByRole("link", { name: "Editar cadastro", exact: true })
    .click();
  await chooseOtherArea("Engenharia de software");
  await page.getByRole("button", { name: "Concluir" }).click();
  await page.waitForURL(/\?salvo=1$/);
  await page.getByText("Engenharia de software", { exact: true }).waitFor();
  await page
    .getByRole("link", { name: "Voltar aos candidatos", exact: true })
    .click();
  await page
    .getByRole("link", { name: "Marina Exemplo", exact: true })
    .waitFor();
});
it("bloqueia duplicidade e abre cadastro existente sem atualizar silenciosamente", async () => {
  expectedHttpErrors.add(409);
  await openForm();
  await fillManual(
    "Nome que não deve sobrescrever",
    `ANA.PEREIRA-${runId}@EXAMPLE.COM`,
  );
  await page
    .getByRole("button", { name: "Confirmar dados", exact: true })
    .click();
  await page.getByText("Este e-mail já possui um cadastro.").waitFor();
  await page.getByRole("link", { name: "Editar cadastro existente" }).click();
  await page.waitForURL(`${baseURL}/candidatos/${anaId}/editar`);
  await page.getByLabel("Nome completo", { exact: false }).waitFor();
  expect(
    await page.getByLabel("Nome completo", { exact: false }).inputValue(),
  ).toBe("Ana Pereira");
});
it("preenche com PDF textual e salva os dados revisados", async () => {
  await openForm();
  await page
    .getByLabel("Nome completo", { exact: false })
    .fill("Camila Revisada");
  await sample();
  await waitForRead();
  expect(
    await page.getByLabel("Nome completo", { exact: false }).inputValue(),
  ).toBe("Camila Revisada");
  expect(await page.getByLabel("E-mail", { exact: false }).inputValue()).toBe(
    `camila.rocha-${runId}@example.com`,
  );
  await page.getByLabel("Telefone", { exact: true }).fill("11988887777");
  await save();
  await page
    .getByRole("heading", { name: "Camila Revisada", level: 1 })
    .waitFor();
  expect(
    await page.getByText("(11) 98888-7777", { exact: true }).isVisible(),
  ).toBe(true);
});
it("rejeita arquivo inválido e acima do limite; falha de leitura preserva o cadastro manual", async () => {
  expectedHttpErrors.add(422);
  await openForm();
  const input = page.getByLabel("Selecionar currículo em PDF");
  await input.setInputFiles({
    name: "arquivo.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("texto"),
  });
  await page.getByText("Selecione um arquivo no formato PDF.").waitFor();
  await input.setInputFiles({
    name: "grande.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.alloc(5 * 1024 * 1024 + 1),
  });
  await page.getByText("O arquivo deve ter no máximo 5 MB.").waitFor();
  await sample("error");
  await page.getByText(/Não foi possível ler este PDF/).waitFor();
  await fillManual("Cadastro após falha", `falha-${runId}@example.com`);
  await save();
});
it("permite completar campos ausentes e ignora o resultado de um PDF removido", async () => {
  await openForm();
  await sample("partial");
  await waitForRead();
  expect(
    await page.getByLabel("Nome completo", { exact: false }).inputValue(),
  ).toBe("");
  expect(await page.getByLabel("E-mail", { exact: false }).inputValue()).toBe(
    `camila.rocha-${runId}@example.com`,
  );
  await page.goto(`${baseURL}/candidatos/novo`);
  await page.getByLabel("Nome completo", { exact: false }).waitFor();
  await sample();
  await page.getByRole("button", { name: "Remover PDF" }).click();
  await page.getByText("Processando o arquivo.").waitFor({ state: "hidden" });
  expect(await page.getByLabel("E-mail", { exact: false }).inputValue()).toBe(
    "",
  );
});
it("mantém navegação e formulário acessíveis em tela pequena", async () => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openForm();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  expect(
    await page.getByLabel("Nome completo", { exact: false }).isVisible(),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/FormMobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({
    path: "test-results/FormDesktop.png",
    fullPage: true,
  });
});

it("alterna a listagem entre linhas e cards sem perder a busca", async () => {
  await page.goto(baseURL);
  await page.getByRole("link", { name: "Ana Pereira", exact: true }).waitFor();
  await page.screenshot({
    path: "test-results/WireframeListDesktop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Visualizar em cards" }).click();
  await page.waitForFunction(
    () =>
      document
        .querySelector('[data-testid="resume-collection"]')
        ?.getAttribute("data-view") === "grid",
  );
  expect(
    await page.getByTestId("resume-collection").getAttribute("data-view"),
  ).toBe("grid");
  await page.screenshot({
    path: "test-results/WireframeGridDesktop.png",
    fullPage: true,
  });
  await page.getByLabel("Buscar candidatos").fill("Ana Pereira");
  expect(
    await page
      .getByRole("link", { name: "Lucas Oliveira", exact: true })
      .count(),
  ).toBe(0);
  await page.getByRole("button", { name: "Visualizar em lista" }).click();
  expect(await page.getByLabel("Buscar candidatos").inputValue()).toBe(
    "Ana Pereira",
  );
  expect(
    await page
      .getByRole("link", { name: "Ana Pereira", exact: true })
      .isVisible(),
  ).toBe(true);
});
it("abre cadastro em dialog no desktop e restaura foco ao cancelar", async () => {
  await page.goto(baseURL);
  const trigger = page.getByRole("button", { name: "Adicionar", exact: true });
  await trigger.click();
  const dialog = page.getByRole("dialog", {
    name: "Adicionar candidato",
    exact: true,
  });
  await dialog.waitFor();
  const rect = await dialog.boundingBox();
  expect(rect).not.toBeNull();
  expect(rect!.x).toBeGreaterThan(100);
  await page
    .getByLabel("Nome completo", { exact: false })
    .fill("Rascunho não salvo");
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  await dialog.waitFor({ state: "hidden" });
  await page.waitForFunction(
    () => document.activeElement?.textContent?.trim() === "Adicionar",
  );
  expect(
    await trigger.evaluate((element) => element === document.activeElement),
  ).toBe(true);
  expect(
    await page
      .getByRole("link", { name: "Rascunho não salvo", exact: true })
      .count(),
  ).toBe(0);
});
it("mostra perfil e edição inline com desfazer e validação de e-mail", async () => {
  await page.goto(`${baseURL}/candidatos/${anaId}`);
  await page
    .getByRole("heading", { name: "Ana Pereira", exact: true, level: 1 })
    .waitFor();
  await page.screenshot({
    path: "test-results/WireframeProfileDesktop.png",
    fullPage: true,
  });
  await page
    .getByRole("link", { name: "Editar cadastro", exact: true })
    .click();
  const backBounds = await page
    .getByRole("link", { name: "Voltar aos detalhes", exact: true })
    .boundingBox();
  const saveBounds = await page
    .getByRole("button", { name: "Concluir", exact: true })
    .boundingBox();
  expect(
    Math.abs(
      backBounds!.y +
        backBounds!.height / 2 -
        saveBounds!.y -
        saveBounds!.height / 2,
    ),
  ).toBeLessThanOrEqual(2);
  await page
    .getByLabel("Nome completo", { exact: true })
    .fill("Nome temporário");
  await page.getByRole("button", { name: "Desfazer", exact: true }).click();
  expect(
    await page.getByLabel("Nome completo", { exact: true }).inputValue(),
  ).toBe("Ana Pereira");
  await page.getByLabel("E-mail", { exact: true }).fill("invalido");
  await page.getByRole("button", { name: "Concluir", exact: true }).click();
  await page.getByText("Informe um e-mail válido.").waitFor();
  await page
    .getByLabel("E-mail", { exact: true })
    .fill(`ana.revisada-${runId}@example.com`);
  await page.getByLabel("Telefone", { exact: true }).fill("11912345678");
  expect(await page.getByLabel("Telefone", { exact: true }).inputValue()).toBe(
    "(11) 91234-5678",
  );
  await page.screenshot({
    path: "test-results/WireframeEditDesktop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Concluir", exact: true }).click();
  await page.waitForURL(/\?salvo=1$/);
  await page
    .getByRole("link", {
      name: `ana.revisada-${runId}@example.com`,
      exact: true,
    })
    .waitFor();
});
it("transforma dialogs em bottom sheets no celular, cancela e confirma exclusão", async () => {
  expectedHttpErrors.add(404);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(baseURL);
  await page.getByRole("link", { name: "Ana Pereira", exact: true }).waitFor();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.screenshot({
    path: "test-results/WireframeListMobile.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Adicionar por PDF", exact: true })
    .click();
  const upload = page.getByRole("dialog", {
    name: "Adicionar candidato por PDF",
    exact: true,
  });
  await upload.waitFor();
  await upload.click({ trial: true });
  let bounds = await upload.boundingBox();
  expect(bounds).not.toBeNull();
  expect(Math.abs(bounds!.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(bounds!.y + bounds!.height - 844)).toBeLessThanOrEqual(2);
  await page.screenshot({
    path: "test-results/WireframeBottomSheetMobile.png",
    fullPage: false,
  });
  await page.getByRole("button", { name: "Fechar janela" }).click();
  await upload.waitFor({ state: "hidden" });
  await page.getByRole("link", { name: "Ana Pereira", exact: true }).click();
  await page.getByRole("button", { name: "Excluir candidato" }).click();
  const confirm = page.getByRole("dialog", { name: "Excluir candidato?" });
  await confirm.waitFor();
  await confirm.click({ trial: true });
  bounds = await confirm.boundingBox();
  expect(Math.abs(bounds!.y + bounds!.height - 844)).toBeLessThanOrEqual(2);
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  await confirm.waitFor({ state: "hidden" });
  expect(
    await page
      .getByRole("heading", { name: "Ana Pereira", level: 1, exact: true })
      .isVisible(),
  ).toBe(true);
  await page.getByRole("button", { name: "Excluir candidato" }).click();
  await page.getByRole("button", { name: "Confirmar exclusão" }).click();
  await page.waitForURL(/\?excluido=1$/);
  await page
    .getByRole("link", { name: "Lucas Oliveira", exact: true })
    .waitFor();
  expect(
    await page.getByRole("link", { name: "Ana Pereira", exact: true }).count(),
  ).toBe(0);
});

it("cadastra manualmente no bottom sheet móvel com validação e ações roláveis", async () => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(baseURL);
  await page.getByRole("button", { name: "Adicionar", exact: true }).click();
  const dialog = page.getByRole("dialog", {
    name: "Adicionar candidato",
    exact: true,
  });
  await dialog.waitFor();
  await page
    .getByRole("button", { name: "Confirmar dados", exact: true })
    .click();
  await page.getByText("Informe o nome completo.").waitFor();
  await fillManual("Cadastro Mobile", `mobile-${runId}@example.com`);
  await page.getByLabel("Telefone", { exact: true }).fill("21987654321");
  await page
    .getByRole("button", { name: "Confirmar dados", exact: true })
    .click();
  await page.waitForURL(/\?salvo=1$/);
  await page
    .getByRole("heading", { name: "Cadastro Mobile", exact: true })
    .waitFor();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
});

async function expectOrder(names: string[]) {
  await page.waitForFunction(
    (expected) =>
      JSON.stringify(
        Array.from(
          document.querySelectorAll('[data-testid="resume-item"]'),
          (element) => element.getAttribute("aria-label"),
        ),
      ) === JSON.stringify(expected),
    names,
  );
}
it("organiza candidatos pelo menu, preserva busca e cards e fecha com Escape", async () => {
  await page.goto(baseURL);
  await expectOrder([
    "Ana Pereira",
    "Beatriz Santos",
    "Júlia Almeida",
    "Lucas Oliveira",
    "Rafael Costa",
  ]);
  expect(await page.getByLabel("Filtrar por área").count()).toBe(0);
  const trigger = page.getByRole("button", {
    name: "Organizar candidatos",
    exact: true,
  });
  await trigger.click();
  const menu = page.getByRole("dialog", { name: "Ordenação dos candidatos" });
  await menu.waitFor();
  await page.waitForFunction(
    (element) => getComputedStyle(element).opacity === "1",
    await menu.elementHandle(),
  );
  await page.screenshot({ path: "test-results/SortMenuDesktop.png" });
  await page
    .getByLabel("Organizar por", { exact: true })
    .selectOption("oldest");
  await expectOrder([
    "Júlia Almeida",
    "Rafael Costa",
    "Beatriz Santos",
    "Lucas Oliveira",
    "Ana Pereira",
  ]);
  await page
    .getByLabel("Organizar por", { exact: true })
    .selectOption("newest");
  await expectOrder([
    "Ana Pereira",
    "Lucas Oliveira",
    "Beatriz Santos",
    "Rafael Costa",
    "Júlia Almeida",
  ]);
  await page.keyboard.press("Escape");
  await menu.waitFor({ state: "hidden" });
  await page.waitForFunction(
    () =>
      document.activeElement?.getAttribute("aria-label") ===
      "Organizar candidatos",
  );
  await page.getByRole("button", { name: "Visualizar em cards" }).click();
  await page.waitForFunction(
    () =>
      document
        .querySelector('[data-testid="resume-collection"]')
        ?.getAttribute("data-view") === "grid",
  );
  await page.getByLabel("Buscar candidatos").fill("Ana");
  await trigger.click();
  expect(
    await page.getByLabel("Organizar por", { exact: true }).inputValue(),
  ).toBe("newest");
  await page.keyboard.press("Escape");
  await menu.waitFor({ state: "hidden" });
  expect(await page.getByLabel("Buscar candidatos").inputValue()).toBe("Ana");
  await expectOrder(["Ana Pereira"]);
});
it.each(["lista", "cards"])(
  "abre o perfil ao clicar no contato do item em %s e usa cursores de ação",
  async (view) => {
    await page.goto(baseURL);
    await page
      .getByRole("link", { name: "Ana Pereira", exact: true })
      .waitFor();
    if (view === "cards") {
      await page.getByRole("button", { name: "Visualizar em cards" }).click();
      await page.waitForFunction(
        () =>
          document
            .querySelector('[data-testid="resume-collection"]')
            ?.getAttribute("data-view") === "grid",
      );
    }
    const cursors = await page
      .getByRole("button")
      .evaluateAll((elements) =>
        elements
          .filter((el) => !(el as HTMLButtonElement).disabled)
          .map((el) => getComputedStyle(el).cursor),
      );
    expect(cursors.every((cursor) => cursor === "pointer")).toBe(true);
    expect(
      await page
        .getByRole("link", { name: "Ana Pereira", exact: true })
        .evaluate((element) => getComputedStyle(element).cursor),
    ).toBe("pointer");
    await page
      .getByText(`ana.pereira-${runId}@example.com`, { exact: true })
      .click();
    await page.waitForURL(`${baseURL}/candidatos/${anaId}`);
    await page
      .getByRole("heading", { name: "Ana Pereira", exact: true })
      .waitFor();
  },
);
it("mantém menu responsivo e navegação pelo card no celular", async () => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(baseURL);
  await page.getByRole("link", { name: "Ana Pereira", exact: true }).waitFor();
  await page.getByRole("button", { name: "Organizar candidatos" }).click();
  const menu = page.getByRole("dialog", { name: "Ordenação dos candidatos" });
  const bounds = await menu.boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390);
  await page
    .getByLabel("Organizar por", { exact: true })
    .selectOption("oldest");
  await expectOrder([
    "Júlia Almeida",
    "Rafael Costa",
    "Beatriz Santos",
    "Lucas Oliveira",
    "Ana Pereira",
  ]);
  await page.screenshot({ path: "test-results/SortMenuMobile.png" });
  await page.keyboard.press("Escape");
  await menu.waitFor({ state: "hidden" });
  await page
    .getByText(`julia.almeida-${runId}@example.com`, { exact: true })
    .click();
  await page.waitForURL(`${baseURL}/candidatos/${juliaId}`);
  await page
    .getByRole("heading", { name: "Júlia Almeida", exact: true })
    .waitFor();
});
type MotionCapture = {
  frames: { opacity: number; y: number }[];
  observer: MutationObserver;
  raf: number;
  target: HTMLElement | null;
};
async function startMotionCapture() {
  await page.evaluate(() => {
    const capture: MotionCapture = {
      frames: [],
      observer: null as unknown as MutationObserver,
      raf: 0,
      target: null,
    };
    const collect = () => {
      capture.target =
        document.querySelector<HTMLElement>('[role="dialog"]') ??
        capture.target;
      const element = capture.target;
      if (!element) return;
      const style = element.isConnected
        ? getComputedStyle(element)
        : element.style;
      const opacity = Number(style.opacity);
      const y = new DOMMatrixReadOnly(style.transform || "none").m42;
      capture.frames.push({ opacity, y });
    };
    capture.observer = new MutationObserver(collect);
    capture.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style"],
    });
    function tick() {
      collect();
      capture.raf = requestAnimationFrame(tick);
    }
    tick();
    (window as Window & { motionCapture?: MotionCapture }).motionCapture =
      capture;
  });
}
async function finishMotionCapture() {
  return page.evaluate(() => {
    const scope = window as Window & { motionCapture?: MotionCapture };
    const capture = scope.motionCapture!;
    capture.observer.disconnect();
    cancelAnimationFrame(capture.raf);
    delete scope.motionCapture;
    return capture.frames;
  });
}
async function waitForRest() {
  await page.waitForFunction(() => {
    const element = document.querySelector('[role="dialog"]');
    if (!element) return false;
    const style = getComputedStyle(element);
    return (
      Number(style.opacity) === 1 &&
      new DOMMatrixReadOnly(style.transform).m42 === 0
    );
  });
}
it("anima a entrada e a saída de menus e dialogs e respeita movimento reduzido", async () => {
  await page.goto(baseURL);
  await startMotionCapture();
  await page.getByRole("button", { name: "Organizar candidatos" }).click();
  const menu = page.getByRole("dialog", { name: "Ordenação dos candidatos" });
  await waitForRest();
  expect(
    (await finishMotionCapture()).some(
      (frame) => frame.opacity < 1 && frame.y > 0,
    ),
  ).toBe(true);
  await startMotionCapture();
  await page.keyboard.press("Escape");
  await menu.waitFor({ state: "hidden" });
  expect(
    (await finishMotionCapture()).some(
      (frame) => frame.opacity < 1 && frame.y > 0,
    ),
  ).toBe(true);
  await startMotionCapture();
  await page.getByRole("button", { name: "Adicionar", exact: true }).click();
  const dialog = page.getByRole("dialog", {
    name: "Adicionar candidato",
    exact: true,
  });
  await waitForRest();
  expect(
    (await finishMotionCapture()).some(
      (frame) => frame.opacity < 1 && frame.y > 0,
    ),
  ).toBe(true);
  await startMotionCapture();
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  await dialog.waitFor({ state: "hidden" });
  expect(
    (await finishMotionCapture()).some(
      (frame) => frame.opacity < 1 && frame.y > 0,
    ),
  ).toBe(true);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await startMotionCapture();
  await page.getByRole("button", { name: "Organizar candidatos" }).click();
  await waitForRest();
  expect(
    (await finishMotionCapture()).every(
      (frame) => frame.opacity === 1 && frame.y === 0,
    ),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await menu.waitFor({ state: "hidden" });
});
it("mostra somente cards no celular e preserva a escolha do desktop ao redimensionar", async () => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(baseURL);
  await page.getByRole("link", { name: "Ana Pereira", exact: true }).waitFor();
  const waitForView = (view: string) =>
    page.waitForFunction(
      (value) =>
        document
          .querySelector('[data-testid="resume-collection"]')
          ?.getAttribute("data-view") === value,
      view,
    );
  await waitForView("grid");
  expect(
    await page
      .getByRole("group", { name: "Visualização dos candidatos" })
      .count(),
  ).toBe(0);
  expect(
    await page.getByRole("button", { name: "Visualizar em lista" }).count(),
  ).toBe(0);
  expect(
    await page.getByRole("button", { name: "Visualizar em cards" }).count(),
  ).toBe(0);
  await page.screenshot({
    path: "test-results/MobileCardsOnly.png",
    fullPage: true,
  });
  await page.getByLabel("Buscar candidatos").fill("Ana");
  await page.setViewportSize({ width: 640, height: 900 });
  await waitForView("list");
  expect(
    await page.getByRole("button", { name: "Visualizar em lista" }).isVisible(),
  ).toBe(true);
  expect(await page.getByLabel("Buscar candidatos").inputValue()).toBe("Ana");
  await page.getByRole("button", { name: "Visualizar em cards" }).click();
  await waitForView("grid");
  await page.setViewportSize({ width: 639, height: 844 });
  await waitForView("grid");
  expect(
    await page
      .getByRole("group", { name: "Visualização dos candidatos" })
      .count(),
  ).toBe(0);
  await page.setViewportSize({ width: 640, height: 900 });
  await waitForView("grid");
  expect(
    await page
      .getByRole("button", { name: "Visualizar em cards" })
      .getAttribute("aria-pressed"),
  ).toBe("true");
  await page.getByRole("button", { name: "Visualizar em lista" }).click();
  await waitForView("list");
  await page.setViewportSize({ width: 390, height: 844 });
  await waitForView("grid");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await waitForView("list");
  expect(await page.getByLabel("Buscar candidatos").inputValue()).toBe("Ana");
});

it("organiza a criação em duas colunas no desktop com arquivo removível e campos revisáveis", async () => {
  await page.goto(baseURL);
  await page.getByRole("button", { name: "Adicionar", exact: true }).click();
  const dialog = page.getByRole("dialog", {
    name: "Adicionar candidato",
    exact: true,
  });
  await dialog.click({ trial: true });
  const pdf = await page
    .getByRole("complementary", { name: "Preenchimento por PDF" })
    .boundingBox();
  const field = await page
    .getByLabel("Nome completo", { exact: false })
    .boundingBox();
  expect(pdf!.x + pdf!.width).toBeLessThanOrEqual(field!.x);
  await page.screenshot({ path: "test-results/CreationDesktopEmpty.png" });
  await uploadPdf();
  await page.getByText("curriculo-exemplo.pdf", { exact: true }).waitFor();
  await page.screenshot({ path: "test-results/CreationDesktopSelected.png" });
  await page.getByRole("button", { name: "Remover PDF" }).click();
  expect(
    await page.getByRole("button", { name: "Processar dados" }).count(),
  ).toBe(0);
  await fillManual("Rascunho", `rascunho-${runId}@example.com`);
  await page.getByRole("button", { name: "Limpar dados" }).click();
  expect(
    await page.getByLabel("Nome completo", { exact: false }).inputValue(),
  ).toBe("");
  await page
    .getByLabel("Nome completo", { exact: false })
    .fill("Nome revisado no desktop");
  await sample();
  await waitForRead();
  expect(
    await page.getByLabel("Nome completo", { exact: false }).inputValue(),
  ).toBe("Nome revisado no desktop");
  await page
    .getByLabel("Área de atuação", { exact: true })
    .selectOption({ label: designName });
  expect(await page.getByLabel("Informe a área de atuação").count()).toBe(0);
  await chooseOtherArea("Pesquisa educacional");
  await page
    .getByLabel("E-mail", { exact: false })
    .fill(`desktop-revisado-${runId}@example.com`);
  await save();
  await page
    .getByRole("heading", { name: "Nome revisado no desktop", exact: true })
    .waitFor();
  await page.getByText("Pesquisa educacional", { exact: true }).waitFor();
});
it("avança no PDF móvel de arquivo a processamento e revisão sem salvar automaticamente", async () => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(baseURL);
  await page
    .getByRole("button", { name: "Adicionar por PDF", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Adicionar candidato por PDF",
    exact: true,
  });
  await dialog.click({ trial: true });
  expect(await page.getByLabel("Nome completo", { exact: false }).count()).toBe(
    0,
  );
  await page.screenshot({ path: "test-results/CreationMobileUpload.png" });
  const file = page.getByLabel("Selecionar currículo em PDF");
  await file.setInputFiles({
    name: "invalido.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("texto"),
  });
  await page.getByText("Selecione um arquivo no formato PDF.").waitFor();
  expect(
    await page.getByRole("button", { name: "Processar dados" }).isDisabled(),
  ).toBe(true);
  await page.getByRole("button", { name: "Remover PDF" }).click();
  await uploadPdf();
  await page.getByText("curriculo-exemplo.pdf", { exact: true }).waitFor();
  await page.screenshot({ path: "test-results/CreationMobileSelected.png" });
  await page.getByRole("button", { name: "Processar dados" }).click();
  await page.getByRole("heading", { name: "Lendo seu currículo" }).waitFor();
  expect(await page.getByLabel("Nome completo", { exact: false }).count()).toBe(
    0,
  );
  await page.screenshot({ path: "test-results/CreationMobileProcessing.png" });
  await page.getByLabel("Nome completo", { exact: false }).waitFor();
  expect(
    await page.getByLabel("Nome completo", { exact: false }).inputValue(),
  ).toBe("Camila Rocha");
  expect(
    await page
      .getByRole("heading", { name: "Revise os dados do candidato" })
      .count(),
  ).toBe(0);
  expect(await page.getByText(/etapa \d de/).count()).toBe(0);
  expect(page.url()).toBe(`${baseURL}/`);
  await page
    .getByLabel("Nome completo", { exact: false })
    .fill("Camila revisada no celular");
  await page.getByRole("button", { name: "Voltar ao arquivo" }).click();
  await page.getByRole("button", { name: "Processar dados" }).click();
  await page.getByLabel("Nome completo", { exact: false }).waitFor();
  expect(
    await page.getByLabel("Nome completo", { exact: false }).inputValue(),
  ).toBe("Camila revisada no celular");
  await page
    .getByLabel("E-mail", { exact: false })
    .fill(`mobile-revisado-${runId}@example.com`);
  await page
    .getByLabel("Resumo profissional")
    .fill("Trajetória e objetivos revisados no celular.");
  await page
    .getByRole("heading", { name: "Adicionar candidato por PDF", exact: true })
    .scrollIntoViewIfNeeded();
  await chooseOtherArea("Projetos educacionais móveis");
  await page
    .getByRole("heading", { name: "Adicionar candidato por PDF", exact: true })
    .scrollIntoViewIfNeeded();
  await page.screenshot({ path: "test-results/CreationMobileReview.png" });
  await page.getByLabel("Telefone", { exact: true }).scrollIntoViewIfNeeded();
  await page.screenshot({
    path: "test-results/CreationMobileReviewContacts.png",
  });
  await save();
  await page
    .getByRole("heading", { name: "Camila revisada no celular", exact: true })
    .waitFor();
  await page
    .getByText("Trajetória e objetivos revisados no celular.", { exact: true })
    .waitFor();
  await page
    .getByText("Projetos educacionais móveis", { exact: true })
    .waitFor();
});
it("permite continuar manualmente após erro no PDF móvel e limpar a revisão", async () => {
  expectedHttpErrors.add(422);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(baseURL);
  await page
    .getByRole("button", { name: "Adicionar por PDF", exact: true })
    .click();
  await sample("error");
  await page.getByText(/Não foi possível ler este PDF/).waitFor();
  await page.getByRole("button", { name: "Fechar janela" }).click();
  await page
    .getByRole("dialog", { name: "Adicionar candidato por PDF", exact: true })
    .waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "Adicionar", exact: true }).click();
  await page.getByLabel("Nome completo", { exact: false }).waitFor();
  await fillManual("Rascunho móvel", `rascunho-movel-${runId}@example.com`);
  await page.getByRole("button", { name: "Limpar dados" }).click();
  expect(
    await page.getByLabel("Nome completo", { exact: false }).inputValue(),
  ).toBe("");
  expect(await page.getByLabel("E-mail", { exact: false }).inputValue()).toBe(
    "",
  );
  await page
    .getByRole("button", { name: "Confirmar dados", exact: true })
    .click();
  await page.getByText("Informe o nome completo.").waitFor();
  await fillManual(
    "Cadastro após erro móvel",
    `erro-movel-${runId}@example.com`,
  );
  await save();
  await page
    .getByRole("heading", { name: "Cadastro após erro móvel", exact: true })
    .waitFor();
});

it("mantém a barra de ações móvel opaca até o fim da área de rolagem", async () => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(baseURL);
  await page.getByRole("button", { name: "Adicionar", exact: true }).click();
  await page.getByLabel("Telefone", { exact: true }).fill("11999999999");
  await page
    .getByLabel("Nome completo", { exact: false })
    .scrollIntoViewIfNeeded();
  const footer = page.getByTestId("resume-form-actions");
  const scroll = page.getByTestId("dialog-scroll-region");
  const bottom = (await footer.boundingBox())!;
  const bounds = (await scroll.boundingBox())!;
  await page.screenshot({ path: "test-results/CreationMobileActions.png" });
  expect(
    Math.abs(bottom.y + bottom.height - bounds.y - bounds.height),
  ).toBeLessThanOrEqual(2);
  expect(
    await footer.evaluate(
      (element) => getComputedStyle(element).backgroundColor,
    ),
  ).toBe("rgb(255, 255, 255)");
  expect(
    await page.getByRole("button", { name: "Usar PDF de exemplo" }).count(),
  ).toBe(0);
  expect(
    await page.getByRole("button", { name: "Preencher manualmente" }).count(),
  ).toBe(0);
  expect(await page.getByText("Cenários da demonstração").count()).toBe(0);
  await page.getByLabel("Telefone", { exact: true }).scrollIntoViewIfNeeded();
  await page
    .getByRole("button", { name: "Confirmar dados", exact: true })
    .click();
  await page.getByText("Informe o nome completo.").waitFor();
  await fillManual("Cadastro com ações fixas", `acoes-${runId}@example.com`);
  await save();
  await page.getByText("(11) 99999-9999", { exact: true }).waitFor();
});

it("mantém escolher outro arquivo como ação secundária no celular", async () => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(baseURL);
  await page
    .getByRole("button", { name: "Adicionar por PDF", exact: true })
    .click();
  await uploadPdf();
  const button = page.getByRole("button", {
    name: "Escolher outro arquivo",
    exact: true,
  });
  const style = await button.evaluate((element) => ({
    background: getComputedStyle(element).backgroundColor,
  }));
  expect(style.background).toBe("rgba(0, 0, 0, 0)");
});

it.each([1440, 390])(
  "abre Áreas de atuação pelos botões do header e do footer em %s px",
  async (width) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    await page.goto(baseURL);
    await page
      .getByRole("banner")
      .getByRole("link", { name: "Áreas de atuação", exact: true })
      .click();
    await page.waitForURL(/\/areas-de-atuacao$/);
    await page
      .getByRole("heading", { name: "Áreas de atuação", level: 1, exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: `Consultar área ${designName}` })
      .waitFor();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    await page.screenshot({
      path: `test-results/Areas${width === 390 ? "Mobile" : "Desktop"}.png`,
      fullPage: true,
    });
    await page
      .getByRole("link", { name: "Voltar aos candidatos", exact: true })
      .click();
    await page
      .getByRole("contentinfo")
      .getByRole("link", { name: "Áreas de atuação", exact: true })
      .click();
    await page.waitForURL(/\/areas-de-atuacao$/);
    await page
      .getByRole("button", { name: `Consultar área ${designName}` })
      .waitFor();
  },
);
async function saveArea(name: string, description: string) {
  await page.getByLabel("Nome da área", { exact: false }).fill(name);
  await page
    .getByLabel("Descrição da área", { exact: false })
    .fill(description);
  await page.getByRole("button", { name: "Salvar área", exact: true }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await page
    .getByRole("button", { name: `Consultar área ${name}`, exact: true })
    .waitFor();
}
it("gerencia catálogo, atualiza vínculos e bloqueia exclusão até desvincular o candidato", async () => {
  expectedHttpErrors.add(409);
  await page.goto(`${baseURL}/areas-de-atuacao`);
  await page
    .getByRole("button", { name: "Cadastrar área", exact: true })
    .click();
  await page.getByRole("button", { name: "Salvar área", exact: true }).click();
  await page.getByText("Informe o nome da área.").waitFor();
  await page.getByText("Informe a descrição da área.").waitFor();
  await saveArea("Educação", "Projetos e experiências educacionais.");
  await page
    .getByRole("button", { name: "Consultar área Educação", exact: true })
    .click();
  const details = page.getByRole("dialog", {
    name: "Detalhes da área de atuação",
  });
  await details
    .getByText("Projetos e experiências educacionais.", { exact: true })
    .waitFor();
  await details.getByRole("button", { name: "Fechar", exact: true }).click();
  await details.waitFor({ state: "hidden" });
  await page
    .getByRole("button", { name: "Editar área Educação", exact: true })
    .click();
  await saveArea(
    "Educação inclusiva",
    "Projetos de inclusão e acessibilidade.",
  );
  await page
    .getByRole("link", { name: "Voltar aos candidatos", exact: true })
    .click();
  await page.getByRole("button", { name: "Adicionar", exact: true }).click();
  await fillManual("Candidato com categoria", `categoria-${runId}@example.com`);
  await page
    .getByLabel("Área de atuação", { exact: true })
    .selectOption({ label: "Educação inclusiva" });
  await save();
  const candidateURL = page.url().split("?")[0];
  await page.reload();
  await page.getByText("Educação inclusiva", { exact: true }).waitFor();
  await page
    .getByRole("banner")
    .getByRole("link", { name: "Áreas de atuação", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Editar área Educação inclusiva",
      exact: true,
    })
    .click();
  await saveArea("Educação atualizada", "Descrição atualizada da categoria.");
  await page
    .getByRole("button", {
      name: "Excluir área Educação atualizada",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Confirmar exclusão", exact: true })
    .click();
  await page
    .getByText(/Área vinculada a candidatos não pode ser excluída/)
    .waitFor();
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await page.goto(candidateURL);
  await page.getByText("Educação atualizada", { exact: true }).waitFor();
  await page
    .getByRole("link", { name: "Editar cadastro", exact: true })
    .click();
  await page
    .getByRole("option", { name: "Educação atualizada", exact: true })
    .waitFor({ state: "attached" });
  expect(
    await page
      .getByLabel("Área de atuação", { exact: true })
      .locator("option:checked")
      .textContent(),
  ).toBe("Educação atualizada");
  await page.getByLabel("Área de atuação", { exact: true }).selectOption("");
  await page.getByRole("button", { name: "Concluir", exact: true }).click();
  await page.waitForURL(/\?salvo=1$/);
  await page.getByText("Área não informada", { exact: true }).waitFor();
  await page
    .getByRole("banner")
    .getByRole("link", { name: "Áreas de atuação", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Excluir área Educação atualizada",
      exact: true,
    })
    .click();
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await page
    .getByRole("button", {
      name: "Consultar área Educação atualizada",
      exact: true,
    })
    .waitFor();
  await page
    .getByRole("button", {
      name: "Excluir área Educação atualizada",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Confirmar exclusão", exact: true })
    .click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  expect(
    await page
      .getByRole("button", {
        name: "Consultar área Educação atualizada",
        exact: true,
      })
      .count(),
  ).toBe(0);
  await page
    .getByRole("link", { name: "Voltar aos candidatos", exact: true })
    .click();
  await page.getByRole("button", { name: "Adicionar", exact: true }).click();
  expect(
    await page
      .getByRole("option", { name: "Educação atualizada", exact: true })
      .count(),
  ).toBe(0);
});
it("valida Outros, preserva texto na edição e não cria categoria automaticamente", async () => {
  await openForm();
  await fillManual("Candidato Outros", `candidato-outros-${runId}@example.com`);
  await chooseOtherArea("   ");
  await page
    .getByRole("button", { name: "Confirmar dados", exact: true })
    .click();
  await page.getByText("Informe a área de atuação.").waitFor();
  await chooseOtherArea("Projetos comunitários");
  await save();
  await page.getByText("Projetos comunitários", { exact: true }).waitFor();
  await page.reload();
  await page
    .getByRole("link", { name: "Editar cadastro", exact: true })
    .click();
  await page.getByLabel("Informe a área de atuação", { exact: true }).waitFor();
  expect(
    await page.getByLabel("Área de atuação", { exact: true }).inputValue(),
  ).toBe("__other");
  expect(
    await page
      .getByLabel("Informe a área de atuação", { exact: true })
      .inputValue(),
  ).toBe("Projetos comunitários");
  await page
    .getByLabel("Área de atuação", { exact: true })
    .selectOption({ label: designName });
  expect(
    await page.getByLabel("Informe a área de atuação", { exact: true }).count(),
  ).toBe(0);
  await page.getByRole("button", { name: "Concluir", exact: true }).click();
  await page.waitForURL(/\?salvo=1$/);
  await page.getByText(designName, { exact: true }).waitFor();
  await page.goto(`${baseURL}/areas-de-atuacao`);
  await page
    .getByLabel("Buscar áreas de atuação")
    .fill("Projetos comunitários");
  await page.getByText("Nenhuma área encontrada").waitFor();
});
it("cadastra uma área pelo bottom sheet móvel", async () => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseURL}/areas-de-atuacao`);
  await page
    .getByRole("button", { name: "Cadastrar área", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Cadastrar área de atuação",
    exact: true,
  });
  await dialog.click({ trial: true });
  const box = (await dialog.boundingBox())!;
  expect(Math.abs(box.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(box.y + box.height - 844)).toBeLessThanOrEqual(2);
  await page.screenshot({ path: "test-results/AreaEditorMobile.png" });
  await saveArea("Área móvel", "Categoria cadastrada em tela pequena.");
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
});
it.each([
  ["desktop", 1440, 1000],
  ["celular", 390, 844],
])(
  "preserva a edição e oferece o cadastro existente em conflito no %s",
  async (_device, width, height) => {
    expectedHttpErrors.add(409);
    await page.setViewportSize({
      width: Number(width),
      height: Number(height),
    });
    await page.goto(`${baseURL}/candidatos/${anaId}/editar`);
    const area = page.getByLabel("Área de atuação", { exact: true });
    await area.selectOption("__other");
    const custom = page.getByLabel("Informe a área de atuação", {
      exact: true,
    });
    expect(await custom.inputValue()).toBe("");
    await page.getByRole("button", { name: "Concluir", exact: true }).click();
    await page.getByText("Informe a área de atuação.").waitFor();
    await custom.fill("Educação comunitária");
    await area.selectOption(areaId);
    await area.selectOption("__other");
    expect(await custom.inputValue()).toBe("Educação comunitária");
    await page
      .getByLabel("E-mail", { exact: true })
      .fill(`lucas.oliveira-${runId}@example.com`);
    await page.getByRole("button", { name: "Concluir", exact: true }).click();
    const existing = page.getByRole("link", {
      name: "Editar cadastro existente",
      exact: true,
    });
    await existing.waitFor();
    expect(await existing.getAttribute("href")).toBe(
      `/candidatos/${lucasId}/editar`,
    );
    expect(await custom.inputValue()).toBe("Educação comunitária");
    expect(page.url()).toContain(`/candidatos/${anaId}/editar`);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(Number(width));
    await page.screenshot({
      path: `test-results/EditConflict-${_device}.png`,
      fullPage: true,
    });
    await existing.click();
    await page.waitForURL(`${baseURL}/candidatos/${lucasId}/editar`);
    expect(
      await page.getByLabel("Nome completo", { exact: true }).inputValue(),
    ).toBe("Lucas Oliveira");
    await page.goto(`${baseURL}/candidatos/${anaId}`);
    await page
      .getByRole("link", {
        name: `ana.pereira-${runId}@example.com`,
        exact: true,
      })
      .waitFor();
    await page.getByText(designName, { exact: true }).waitFor();
  },
);
