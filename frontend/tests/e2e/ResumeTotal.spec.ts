import { chromium } from "playwright";

it("mostra o total informado pela API antes de carregar todas as páginas", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    });
    const responsePromise = page.waitForResponse((response) => {
      const url = new URL(response.url());
      return (
        url.pathname === "/resumes" && response.request().method() === "GET"
      );
    });
    await page.goto(process.env.E2E_BASE_URL ?? "http://127.0.0.1:3100");
    const response = await responsePromise;
    expect(response.ok()).toBe(true);
    const { total } = await response.json();
    const counter = page
      .getByRole("heading", { name: "Candidatos", exact: true })
      .locator("..")
      .locator("span");
    await counter.waitFor();
    await page.waitForFunction(
      ({ expected }) => {
        const heading = Array.from(document.querySelectorAll("h2")).find(
          (element) => element.textContent === "Candidatos",
        );
        return (
          heading?.parentElement?.querySelector("span")?.textContent ===
          String(expected)
        );
      },
      { expected: total },
    );
    expect(await counter.textContent()).toBe(String(total));
  } finally {
    await browser.close();
  }
});
