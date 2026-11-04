import * as z from "zod";
import { USER_ROLES } from "../lib/roles.js";

/**
 * Contrato de criação de usuário.
 *
 * A senha chega em texto puro (protegida pelo TLS/HTTPS) e é transformada
 * em hash scrypt EXCLUSIVAMENTE no servidor. O campo `password_hash` não faz
 * parte do contrato: se enviado pelo cliente, é descartado pelo Zod.
 */
export const createUserSchema = z.object({
  id: z.string().min(1, "id é obrigatório").optional(),
  name: z.string().trim().min(2, "Nome deve ter ao menos 2 caracteres").max(120),
  email: z.string().trim().toLowerCase().email("E-mail inválido").max(254),
  role: z.enum(USER_ROLES, {
    message: "Perfil deve ser GESTOR ou TECNICO",
  }),
  password: z
    .string({ message: "Senha é obrigatória" })
    .min(8, "A senha deve ter no mínimo 8 caracteres")
    .max(128, "A senha deve ter no máximo 128 caracteres")
    .regex(/[A-Za-z]/, "A senha deve conter ao menos uma letra")
    .regex(/[0-9]/, "A senha deve conter ao menos um número"),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const userIdParamsSchema = z.object({
  id: z.string().min(1, "id é obrigatório"),
});
