import { createElement } from "react";
import { render, screen, within } from "@testing-library/react";
import { AppShell } from "./AppShell";
jest.mock("next/navigation", () => ({ usePathname: () => "/" }));
it("oferece acesso ao catálogo no header e no footer", () => {
  render(
    createElement(AppShell, { children: createElement("p", null, "Conteúdo") }),
  );
  for (const region of [
    screen.getByRole("banner"),
    screen.getByRole("contentinfo"),
  ]) {
    expect(
      within(region).getByRole("link", {
        name: "Áreas de atuação",
      }),
    ).toHaveAttribute("href", "/areas-de-atuacao");
  }
});
