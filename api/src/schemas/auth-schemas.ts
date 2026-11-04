import * as z from "zod";

export const loginSchema = z.object({
    email: z
        .string({ message: "E-mail é obrigatório" })
        .trim()
        .toLowerCase()
        .email("E-mail inválido")
        .max(254, "E-mail muito longo"),
    password: z
        .string({ message: "Senha é obrigatória" })
        .min(1, "Senha é obrigatória")
        .max(128, "Senha muito longa"),
});

export type LoginInput = z.infer<typeof loginSchema>;

