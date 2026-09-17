import { z } from 'zod';

export const equipmentSchema = z.object({
  patrimonyTag: z.string().min(1, 'O número de patrimônio é obrigatório.').trim().regex(/^[a-zA-Z0-9]+$/, 'Apenas letras e números são permitidos.'),
  hostname: z.string().min(1, 'O hostname é obrigatório.').trim().regex(/^[a-zA-Z0-9-]+$/, 'Apenas letras, números e hífen são permitidos.'),
  macAddress: z.string()
    .min(1, 'O endereço MAC é obrigatório.')
    .trim()
    .transform(val => val.toUpperCase().replace(/-/g, ':'))
    .refine(val => /^([0-9A-F]{2}:){5}[0-9A-F]{2}$/.test(val), 'Formato de MAC inválido. Use AA:BB:CC:DD:EE:FF.'),
  sectorId: z.string().min(1, 'Selecione um setor responsável.')
});

export type EquipmentFormData = z.infer<typeof equipmentSchema>;
