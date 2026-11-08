import { createElement } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ResumeForm } from "./ResumeForm";
import { api } from "@/core/services/Api";

jest.mock("@/core/services/Api", () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    defaults: { baseURL: "/api" },
  },
}));

const mockedApi = api as unknown as {
  get: jest.Mock;
  post: jest.Mock;
  put: jest.Mock;
  delete: jest.Mock;
  defaults: { baseURL: string };
};

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    createElement(
      QueryClientProvider,
      { client },
      createElement(ResumeForm, { mobileSteps: true }),
    ),
  );
  return userEvent.setup();
}

beforeEach(() => {
  jest.clearAllMocks();
  mockedApi.get.mockResolvedValue({ data: [] });
});

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
    const user = setup();
    await user.click(
      screen.getByRole("button", { name: "Preencher manualmente" }),
    );
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
  mockedApi.post.mockImplementation((url: string) => {
    if (url === "/scan")
      return Promise.reject(
        Object.assign(new Error("network"), {
          isAxiosError: true,
          code: "ERR_NETWORK",
        }),
      );
    return Promise.reject(new Error(`unexpected POST ${url}`));
  });
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
    const user = setup();
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
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: original,
    });
  }
});
