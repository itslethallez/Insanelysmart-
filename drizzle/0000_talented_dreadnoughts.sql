CREATE TYPE "public"."meeting_status" AS ENUM('booked', 'completed');--> statement-breakpoint
CREATE TYPE "public"."person_status" AS ENUM('new', 'booked', 'closed');--> statement-breakpoint
CREATE TYPE "public"."source" AS ENUM('text', 'voice', 'web');--> statement-breakpoint
CREATE TABLE "meetings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"person_id" uuid NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"status" "meeting_status" DEFAULT 'booked' NOT NULL,
	"source" "source" NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "people" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"contact" text NOT NULL,
	"source" "source" NOT NULL,
	"industry_tag" text,
	"status" "person_status" DEFAULT 'new' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE no action ON UPDATE no action;