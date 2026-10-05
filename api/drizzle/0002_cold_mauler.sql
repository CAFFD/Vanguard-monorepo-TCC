TRUNCATE TABLE "telemetry_history";--> statement-breakpoint
ALTER TABLE "telemetry_history" ADD COLUMN "schema_version" smallint;--> statement-breakpoint
ALTER TABLE "telemetry_history" ADD COLUMN "collection_status" text;--> statement-breakpoint
ALTER TABLE "telemetry_history" ADD COLUMN "collection_error" jsonb;--> statement-breakpoint
ALTER TABLE "telemetry_history" ADD COLUMN "protocol" text;--> statement-breakpoint
ALTER TABLE "telemetry_history" ADD COLUMN "media_type" text;--> statement-breakpoint
ALTER TABLE "telemetry_history" ADD COLUMN "device_model" text;--> statement-breakpoint
ALTER TABLE "telemetry_history" ADD COLUMN "device_serial" text;--> statement-breakpoint
ALTER TABLE "telemetry_history" ADD COLUMN "temperature_c" smallint;--> statement-breakpoint
ALTER TABLE "telemetry_history" ADD COLUMN "power_on_hours" bigint;--> statement-breakpoint
ALTER TABLE "telemetry_history" ADD COLUMN "life_remaining_pct" smallint;--> statement-breakpoint
ALTER TABLE "telemetry_history" ADD COLUMN "media_errors" bigint;--> statement-breakpoint
ALTER TABLE "telemetry_history" ADD COLUMN "critical_warnings" smallint;--> statement-breakpoint
ALTER TABLE "telemetry_history" ADD COLUMN "smart_passed" boolean;--> statement-breakpoint
CREATE INDEX "telemetry_equipment_created_idx" ON "telemetry_history" USING btree ("equipment_id","created_at" DESC NULLS LAST);