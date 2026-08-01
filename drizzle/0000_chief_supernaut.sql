CREATE TYPE "public"."meeting_status" AS ENUM('requested', 'confirmed', 'done', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."person_status" AS ENUM('new', 'contacted', 'booked', 'won', 'lost');--> statement-breakpoint
CREATE TYPE "public"."source" AS ENUM('voice', 'savings_tool', 'website', 'manual');--> statement-breakpoint
CREATE TABLE "meetings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"person_id" uuid NOT NULL,
	"scheduled_for" timestamp with time zone,
	"status" "meeting_status" DEFAULT 'requested' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "people" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"contact" text NOT NULL,
	"source" "source" NOT NULL,
	"industry" text,
	"status" "person_status" DEFAULT 'new' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE no action ON UPDATE no action;