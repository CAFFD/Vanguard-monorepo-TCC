import { z } from 'zod';

export const occurrenceSchema = z.object({
  equipmentId: z.string().min(1, 'Selecione um equipamento.'),
  technicianId: z.string().min(1, 'Selecione um técnico responsável.'),
  origin: z.enum(['SOLICITACAO_USUARIO', 'IDENTIFICACAO_TECNICA', 'TELEMETRIA'], { 
    message: 'Selecione uma origem válida.' 
  }),
  priority: z.enum(['BAIXA', 'MEDIA', 'ALTA', 'CRITICA'], { 
    message: 'Selecione uma prioridade.' 
  }),
  description: z.string()
    .min(10, 'A descrição deve ter no mínimo 10 caracteres.')
    .max(1000, 'A descrição deve ter no máximo 1000 caracteres.')
    .trim()
    .refine(val => val.length > 0, 'Não pode conter apenas espaços.'),
  diagnosis: z.string().optional().nullable(),
  actionTaken: z.string()
    .max(1000, 'A ação tomada deve ter no máximo 1000 caracteres.')
    .optional()
    .nullable(),
});

export type OccurrenceFormData = z.infer<typeof occurrenceSchema>;
