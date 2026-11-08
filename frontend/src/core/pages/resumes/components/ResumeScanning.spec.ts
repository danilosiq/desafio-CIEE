import { createElement } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ResumeForm } from "./ResumeForm";

it("permite abrir o formulário manual no fluxo móvel sem PDF", async () => {
  const original = window.matchMedia;
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: () => ({
      matches: true,
      addEventListener() {},
      removeEventListener() {},
    }),
  });
  try {
    const client = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    render(
      createElement(
        QueryClientProvider,
        { client },
        createElement(ResumeForm, { mobileSteps: true }),
      ),
    );
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Preencher manualmente" }));
    expect(screen.getByLabelText(/Nome completo/)).toBeInTheDocument();
    expect(screen.getByLabelText(/E-mail/)).toBeInTheDocument();
  } finally {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: original,
    });
  }
});
