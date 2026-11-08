import { chromium } from "playwright";
import { makeTextPdf } from "../../../backend/tests/fixtures/MakeTextPdf";

it("extrai PDF, revisa, salva e consulta no ambiente isolado", async () => {
  if (
    process.env.E2E_BASE_URL !== "http://127.0.0.1:3103" ||
    process.env.E2E_API_URL !== "http://127.0.0.1:3335" ||
    process.env.E2E_TEST_DATABASE !== "ciee_test"
  ) {
    throw new Error(
      "Configure o frontend e a API isolados para o E2E em ciee_test.",
    );
  }
  const api = process.env.E2E_API_URL;
  const email = `teste${Date.now()}@example.com`;
  const browser = await chromium.launch({ headless: true });
  let id: string | undefined;
  try {
    const page = await browser.newPage();
    await page.goto(`${process.env.E2E_BASE_URL}/candidatos/novo`);
    await page.getByLabel("Selecionar currículo em PDF").setInputFiles({
      name: "curriculo.pdf",
      mimeType: "application/pdf",
      buffer: makeTextPdf([
        "Ana Maria Silva",
        email,
        "Telefone: (11) 99999-0000",
      ]),
    });
    await page.getByRole("button", { name: "Processar dados" }).click();
    await page.waitForFunction(
      (value) =>
        (
          document.querySelector(
            'input[name="email"]',
          ) as HTMLInputElement | null
        )?.value === value,
      email,
    );
    expect(
      await page.getByLabel("Nome completo", { exact: false }).inputValue(),
    ).toBe("Ana Maria Silva");
    expect(
      await page.getByLabel("Telefone", { exact: true }).inputValue(),
    ).toBe("(11) 99999-0000");
    const list = await (await fetch(`${api}/resumes?limit=30`)).json();
    expect(
      list.items.some((item: { email: string }) => item.email === email),
    ).toBe(false);
    await page
      .getByLabel("Nome completo", { exact: false })
      .fill("Ana Maria Teste");
    await page
      .getByRole("button", { name: "Confirmar dados", exact: true })
      .click();
    await page.waitForURL(/\/candidatos\/[^/]+\?salvo=1$/);
    id = new URL(page.url()).pathname.split("/").pop();
    await page.reload();
    await page.getByText("Ana Maria Teste", { exact: true }).first().waitFor();
    const saved = await (await fetch(`${api}/resumes/${id}`)).json();
    expect(saved.fullName).toBe("Ana Maria Teste");
    expect(saved.email).toBe(email);
    await page.goto(process.env.E2E_BASE_URL);
    await page.getByLabel("Buscar candidatos").fill(email);
    await page.getByText("Ana Maria Teste", { exact: true }).first().waitFor();
  } finally {
    if (id) await fetch(`${api}/resumes/${id}`, { method: "DELETE" });
    await browser.close();
  }
});
