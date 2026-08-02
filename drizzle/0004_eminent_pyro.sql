ALTER TYPE "public"."source" ADD VALUE 'audit';--> statement-breakpoint
ALTER TABLE "people" ADD COLUMN "audit" jsonb;--> statement-breakpoint
ALTER TABLE "people" ADD COLUMN "audit_completed_at" timestamp with time zone;