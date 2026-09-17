CREATE TABLE "equipments" (
	"id" text PRIMARY KEY NOT NULL,
	"sector_id" text,
	"mac_address" text,
	"patrimony_tag" text,
	"hostname" text,
	"health_status" text,
	CONSTRAINT "equipments_mac_address_unique" UNIQUE("mac_address"),
	CONSTRAINT "equipments_patrimony_tag_unique" UNIQUE("patrimony_tag")
);
--> statement-breakpoint
CREATE TABLE "occurrences" (
	"id" text PRIMARY KEY NOT NULL,
	"equipment_id" text,
	"technician_id" text,
	"created_at" timestamp,
	"origin" text,
	"priority" text,
	"description" text,
	"diagnosis" text,
	"action_taken" text,
	"closure_date" timestamp
);
--> statement-breakpoint
CREATE TABLE "sectors" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text,
	"role" text,
	"password_hash" text
);
--> statement-breakpoint
ALTER TABLE "equipments" ADD CONSTRAINT "equipments_sector_id_sectors_id_fk" FOREIGN KEY ("sector_id") REFERENCES "public"."sectors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "occurrences" ADD CONSTRAINT "occurrences_equipment_id_equipments_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "occurrences" ADD CONSTRAINT "occurrences_technician_id_users_id_fk" FOREIGN KEY ("technician_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;