CREATE TABLE "telemetry_history" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp,
	"disk_usage_percent" numeric,
	"smart_5" integer,
	"equipment_id" text,
	"smart_187" integer,
	"smart_188" integer,
	"smart_197" integer,
	"smart_198" integer,
	"raw_payload" jsonb
);
--> statement-breakpoint
ALTER TABLE "telemetry_history" ADD CONSTRAINT "telemetry_history_equipment_id_equipments_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipments"("id") ON DELETE no action ON UPDATE no action;