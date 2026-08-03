ALTER TYPE "public"."source" ADD VALUE 'audit';--> statement-breakpoint
ALTER TABLE "people" ADD COLUMN "audit" jsonb;--> statement-breakpoint
ALTER TABLE "people" ADD COLUMN "audit_completed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "people" ADD COLUMN "public_token" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "people" ADD CONSTRAINT "people_public_token_unique" UNIQUE("public_token");