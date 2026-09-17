import { z } from 'zod';

export const sectorSchema = z.object({
  name: z.string()
    .min(2, 'O nome deve ter no mínimo 2 caracteres.')
    .max(100, 'O nome deve ter no máximo 100 caracteres.')
    .trim()
    .refine(val => val.length > 0, 'Não pode conter apenas espaços.'),
  description: z.string()
    .min(5, 'A descrição deve ter no mínimo 5 caracteres.')
    .max(300, 'A descrição deve ter no máximo 300 caracteres.')
    .trim()
    .refine(val => val.length > 0, 'Não pode conter apenas espaços.'),
});

export type SectorFormData = z.infer<typeof sectorSchema>;
