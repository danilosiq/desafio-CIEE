import { AxiosError } from "axios";
import { getApiError } from "./ApiError";

it("orienta preenchimento manual quando o tempo de conexão expira", () => {
  const error = new AxiosError("timeout", "ECONNABORTED");
  expect(getApiError(error).message).toMatch(/tempo|demorou/i);
});
it("explica quando a API está indisponível", () => {
  const error = new AxiosError("Network Error", "ERR_NETWORK");
  expect(getApiError(error).message).toMatch(/conectar|indisponível/i);
});
