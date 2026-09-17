import { integer, jsonb, numeric, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

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
  disk_usage_percent: numeric('disk_usage_percent'),
  smart_5: integer('smart_5'),
  equipment_id: text('equipment_id').references(() => equipments.id),
  smart_187: integer('smart_187'),
  smart_188: integer('smart_188'),
  smart_197: integer('smart_197'),
  smart_198: integer('smart_198'),
  raw_payload: jsonb('raw_payload'),
});
