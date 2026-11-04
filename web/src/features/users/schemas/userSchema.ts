import { z } from 'zod';

export const userSchema = z
  .object({
    name: z
      .string()
      .min(3, 'O nome deve ter no mínimo 3 caracteres.')
      .trim()
      .refine((val) => val.length > 0, 'Não pode conter apenas espaços.'),
    email: z.string().email('E-mail inválido.').trim().toLowerCase(),
    role: z.enum(['GESTOR', 'TECNICO'], { message: 'Selecione um perfil de acesso.' }),
    password: z
      .string()
      .min(8, 'A senha deve ter no mínimo 8 caracteres.')
      .max(128, 'A senha deve ter no máximo 128 caracteres.')
      .regex(/[A-Za-z]/, 'A senha deve conter ao menos uma letra.')
      .regex(/[0-9]/, 'A senha deve conter ao menos um número.'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem.',
    path: ['confirmPassword'],
  });

export type UserFormData = z.infer<typeof userSchema>;
