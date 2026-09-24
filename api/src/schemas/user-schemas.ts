import * as z from "zod";

export const createUserSchema = z.object({
  id: z.string().min(1, "id é obrigatório"),
  name: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
  email: z.string().email("E-mail inválido"),
  role: z.enum(["GESTOR", "TECNICO"], {
    message: "Perfil deve ser GESTOR ou TECNICO",
  }),
  password_hash: z.string().min(1, "password_hash é obrigatório"),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
