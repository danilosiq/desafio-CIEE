import { z } from "zod";
export const areaSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome da área."),
  description: z.string().trim().min(1, "Informe a descrição da área."),
});
