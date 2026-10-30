DROP TABLE "jobs" CASCADE;--> statement-breakpoint
ALTER TABLE "inquiries" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "inquiries" ALTER COLUMN "type" SET DEFAULT 'project'::text;--> statement-breakpoint
DROP TYPE "public"."inquiry_type";--> statement-breakpoint
CREATE TYPE "public"."inquiry_type" AS ENUM('project', 'collab', 'other');--> statement-breakpoint
ALTER TABLE "inquiries" ALTER COLUMN "type" SET DEFAULT 'project'::"public"."inquiry_type";--> statement-breakpoint
ALTER TABLE "inquiries" ALTER COLUMN "type" SET DATA TYPE "public"."inquiry_type" USING "type"::"public"."inquiry_type";