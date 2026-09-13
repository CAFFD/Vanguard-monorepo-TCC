import * as z from "zod";

export const createSectorSchema = z.object({
  id: z
    .string()
    .min(1, "id é obrigatório"),

  name: z
    .string()
    .min(1, "name é obrigatório"),

  description: z
    .string()
    .min(1, "description é obrigatório"),
});

export type CreateSectorInput = z.infer<typeof createSectorSchema>;
