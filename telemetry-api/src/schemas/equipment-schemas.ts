import * as z from "zod";

export const createEquipmentSchema = z.object({
  id: z
    .string()
    .min(1, "id é obrigatório"),

  sector_id: z
    .string()
    .min(1, "sector_id é obrigatório"),

  mac_address: z
    .string()
    .min(1, "mac_address é obrigatório"),

  patrimony_tag: z
    .string()
    .min(1, "patrimony_tag é obrigatório"),

  hostname: z
    .string()
    .min(1, "hostname é obrigatório"),

  health_status: z
    .string()
    .min(1, "health_status é obrigatório"),
});

export type CreateEquipmentInput = z.infer<typeof createEquipmentSchema>;

export const updateEquipmentSchema = z.object({
  sector_id: z
    .string()
    .min(1, "sector_id é obrigatório"),

  mac_address: z
    .string()
    .min(1, "mac_address é obrigatório"),

  patrimony_tag: z
    .string()
    .min(1, "patrimony_tag é obrigatório"),

  hostname: z
    .string()
    .min(1, "hostname é obrigatório"),

  health_status: z
    .string()
    .min(1, "health_status é obrigatório"),
});

export type UpdateEquipmentInput = z.infer<typeof updateEquipmentSchema>;
