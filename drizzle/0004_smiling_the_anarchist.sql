CREATE TYPE "public"."person_type" AS ENUM('lead', 'client', 'supplier', 'other');--> statement-breakpoint
ALTER TABLE "meetings" ADD COLUMN "tenant_id" uuid DEFAULT '00000000-0000-0000-0000-000000000001' NOT NULL;--> statement-breakpoint
ALTER TABLE "people" ADD COLUMN "person_type" "person_type" DEFAULT 'lead' NOT NULL;--> statement-breakpoint
ALTER TABLE "people" ADD COLUMN "tenant_id" uuid DEFAULT '00000000-0000-0000-0000-000000000001' NOT NULL;--> statement-breakpoint
CREATE INDEX "meetings_tenant_id_idx" ON "meetings" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "people_tenant_id_idx" ON "people" USING btree ("tenant_id");