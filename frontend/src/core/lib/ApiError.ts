import { isAxiosError } from "axios";
export function getApiError(error: unknown): {
  message: string;
  existingId?: string;
} {
  if (isAxiosError<{ message?: string; existingId?: string }>(error))
    return {
      message:
        error.response?.data?.message ??
        "Não foi possível concluir. Tente novamente.",
      existingId: error.response?.data?.existingId,
    };
  return { message: "Não foi possível concluir. Tente novamente." };
}
