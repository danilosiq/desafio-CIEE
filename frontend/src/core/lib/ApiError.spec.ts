import { AxiosError, AxiosHeaders } from "axios";
import { getApiError } from "./ApiError";

it("orienta preenchimento manual quando o tempo de conexão expira", () => {
  const error = new AxiosError("timeout", "ECONNABORTED");
  expect(getApiError(error).message).toMatch(/tempo|demorou/i);
});
it("explica quando a API está indisponível", () => {
  const error = new AxiosError("Network Error", "ERR_NETWORK");
  expect(getApiError(error).message).toMatch(/conectar|indisponível/i);
});
it("mostra a mensagem de erro estruturada do processamento do PDF", () => {
  const error = new AxiosError(
    "unprocessable",
    undefined,
    undefined,
    undefined,
    {
      status: 422,
      statusText: "",
      headers: {},
      config: { headers: new AxiosHeaders() },
      data: {
        error: {
          code: "NO_EXTRACTABLE_TEXT",
          message: "PDF sem texto. Continue manualmente.",
        },
      },
    },
  );
  expect(getApiError(error).message).toBe(
    "PDF sem texto. Continue manualmente.",
  );
});
