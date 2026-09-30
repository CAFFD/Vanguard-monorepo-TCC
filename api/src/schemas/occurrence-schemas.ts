import { z } from 'zod';

export const createOccurrenceSchema = z.object({
  equipment_id: z.string().uuid('O ID do equipamento deve ser um UUID válido.'),
  technician_id: z.string().uuid('O ID do técnico deve ser um UUID válido.').optional().nullable(),
  origin: z.enum(['SOLICITACAO_USUARIO', 'IDENTIFICACAO_TECNICA', 'TELEMETRIA', 'manual', 'automatico']).default('SOLICITACAO_USUARIO'),
  priority: z.enum(['BAIXA', 'MEDIA', 'ALTA', 'CRITICA', 'baixa', 'media', 'alta', 'critica']),
  description: z.string().min(10, 'A descrição deve ter pelo menos 10 caracteres.'),
  diagnosis: z.string().optional().nullable(),
  action_taken: z.string().optional().nullable(),
});

export type CreateOccurrenceBody = z.infer<typeof createOccurrenceSchema>;
