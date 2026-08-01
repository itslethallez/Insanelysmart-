ALTER TABLE "people" ADD COLUMN "company_name" text;--> statement-breakpoint
ALTER TABLE "people" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "people" ADD COLUMN "details_captured" boolean DEFAULT false NOT NULL;