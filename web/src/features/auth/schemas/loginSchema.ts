import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Informe seu e-mail institucional.')
    .trim()
    .toLowerCase()
    .email('Informe um endereço de e-mail válido.'),
  password: z
    .string()
    .min(1, 'Informe sua senha de acesso.'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

