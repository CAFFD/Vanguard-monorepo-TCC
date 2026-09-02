import * as z from "zod";

export const telemetrySchema = z.object({
  hostname: z
    .string()
    .min(1, "hostname é obrigatório"),

  disk_usage: z
    .number()
    .min(0, "disk_usage não pode ser menor que 0")
    .max(100, "disk_usage não pode ser maior que 100"),

  smart_5: z
    .number()
    .int()
    .nonnegative(),

  smart_187: z
    .number()
    .int()
    .nonnegative(),

  smart_188: z
    .number()
    .int()
    .nonnegative(),

  smart_197: z
    .number()
    .int()
    .nonnegative(),

  smart_198: z
    .number()
    .int()
    .nonnegative(),
});

export type TelemetryInput =
  z.infer<typeof telemetrySchema>;