import { isAxiosError } from "axios";
export function getApiError(error: unknown): {
  message: string;
  existingId?: string;
} {
  if (
    isAxiosError<{
      message?: string;
      existingId?: string;
      error?: { message?: string };
    }>(error)
  ) {
    if (
      (error.code === "ECONNABORTED" ||
        error.code === "ETIMEDOUT" ||
        error.response?.status === 504) &&
      !(error.response?.data?.error?.message ?? error.response?.data?.message)
    )
      return {
        message:
          "O tempo de leitura terminou. Tente novamente ou preencha os dados manualmente.",
      };
    if (!error.response && error.code !== "ERR_CANCELED")
      return {
        message: "Não foi possível conectar ao serviço. Tente novamente.",
      };
    return {
      message:
        error.response?.data?.error?.message ??
        error.response?.data?.message ??
        "Não foi possível concluir. Tente novamente.",
      existingId: error.response?.data?.existingId,
    };
  }
  return { message: "Não foi possível concluir. Tente novamente." };
}
