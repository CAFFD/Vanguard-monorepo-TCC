import { integer, jsonb, numeric, pgTable, text, timestamp, smallint, bigint, boolean, index } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email'),
  role: text('role'),
  password_hash: text('password_hash'),
});

export const sectors = pgTable('sectors', {
  id: text('id').primaryKey(),
  name: text('name'),
  description: text('description'),
});

export const equipments = pgTable('equipments', {
  id: text('id').primaryKey(),
  sector_id: text('sector_id').references(() => sectors.id),
  mac_address: text('mac_address').unique(),
  patrimony_tag: text('patrimony_tag').unique(),
  hostname: text('hostname'),
  health_status: text('health_status'),
});

export const occurrences = pgTable('occurrences', {
  id: text('id').primaryKey(),
  equipment_id: text('equipment_id').references(() => equipments.id),
  technician_id: text('technician_id').references(() => users.id),
  created_at: timestamp('created_at'),
  origin: text('origin'),
  priority: text('priority'),
  description: text('description'),
  diagnosis: text('diagnosis'),
  action_taken: text('action_taken'),
  closure_date: timestamp('closure_date'),
});

export const telemetryHistory = pgTable('telemetry_history', {
  id: text('id').primaryKey(),
  created_at: timestamp('created_at'),
  equipment_id: text('equipment_id').references(() => equipments.id),

  // Contrato V2
  schema_version: smallint('schema_version'),
  collection_status: text('collection_status'),
  collection_error: jsonb('collection_error'),

  protocol: text('protocol'),
  media_type: text('media_type'),
  device_model: text('device_model'),
  device_serial: text('device_serial'),

  disk_usage_percent: numeric('disk_usage_percent'),
  temperature_c: smallint('temperature_c'),
  power_on_hours: bigint('power_on_hours', { mode: 'number' }),
  life_remaining_pct: smallint('life_remaining_pct'),
  media_errors: bigint('media_errors', { mode: 'number' }),
  critical_warnings: smallint('critical_warnings'),
  smart_passed: boolean('smart_passed'),

  raw_payload: jsonb('raw_payload'),

  // Legado
  smart_5: integer('smart_5'),
  smart_187: integer('smart_187'),
  smart_188: integer('smart_188'),
  smart_197: integer('smart_197'),
  smart_198: integer('smart_198'),
}, (table) => ({
  telemetry_equipment_created_idx: index('telemetry_equipment_created_idx').on(table.equipment_id, table.created_at.desc())
}));
