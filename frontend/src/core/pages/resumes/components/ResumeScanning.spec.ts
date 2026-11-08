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

it("mostra a falha da leitura ao continuar manualmente no celular", async () => {
  const original = window.matchMedia;
  const { api } = await import("@/core/services/Api");
  const originalBase = api.defaults.baseURL;
  api.defaults.baseURL = "http://127.0.0.1:1";
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
    const user = userEvent.setup();
    await user.upload(
      screen.getByLabelText("Selecionar currículo em PDF"),
      new File(["%PDF-1.4"], "ficticio.pdf", { type: "application/pdf" }),
    );
    await user.click(screen.getByRole("button", { name: "Processar dados" }));
    await user.click(
      screen.getByRole("button", { name: "Preencher manualmente" }),
    );
    expect(
      await screen.findByText(/não foi possível conectar ao serviço/i),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Nome completo/)).toBeInTheDocument();
  } finally {
    api.defaults.baseURL = originalBase;
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: original,
    });
  }
});
