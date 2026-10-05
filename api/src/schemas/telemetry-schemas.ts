import * as z from "zod";

const metric = <T extends z.ZodType>(s: T) => s.nullish();

export const telemetrySchema = z.object({
  schema_version: z.number().int().optional(),
  hostname: z.string().min(1, "hostname é obrigatório"),
  agent_version: z.string().optional(),

  collection_status: z.enum(['ok', 'partial', 'failed']).optional(),
  collection_error: z.object({ code: z.string(), message: z.string() }).nullish(),

  protocol: z.string().optional(),
  media_type: z.string().optional(),
  device_model: z.string().nullish(),
  device_serial: z.string().nullish(),

  disk_usage_percent: metric(z.number().min(0).max(100)),
  disk_usage: metric(z.number().min(0).max(100)), // legacy

  temperature_c: metric(z.number().int()),
  power_on_hours: metric(z.number().int().nonnegative()),
  life_remaining_pct: metric(z.number().int().min(0).max(100)),
  media_errors: metric(z.number().int().nonnegative()),
  critical_warnings: metric(z.number().int().nonnegative()),
  smart_passed: metric(z.boolean()),

  raw_payload: z.record(z.string(), z.unknown()).optional(),

  // Legacy fields
  smart_5: metric(z.number().int().nonnegative()),
  smart_187: metric(z.number().int().nonnegative()),
  smart_188: metric(z.number().int().nonnegative()),
  smart_197: metric(z.number().int().nonnegative()),
  smart_198: metric(z.number().int().nonnegative()),
});

export type TelemetryInput = z.infer<typeof telemetrySchema>;
