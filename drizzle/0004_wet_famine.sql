CREATE TYPE "public"."category_target_type" AS ENUM('NONE', 'ONCE', 'MONTHLY');--> statement-breakpoint
CREATE TABLE "category_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"budget_id" uuid NOT NULL,
	"name" text NOT NULL,
	"group_name" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"target_type" "category_target_type" DEFAULT 'NONE' NOT NULL,
	"target_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"target_due_date" timestamp with time zone,
	"target_month_day" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "budget_categories" ADD COLUMN "template_id" uuid;--> statement-breakpoint
ALTER TABLE "category_templates" ADD CONSTRAINT "category_templates_budget_id_budgets_id_fk" FOREIGN KEY ("budget_id") REFERENCES "public"."budgets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "category_templates_budget_id_idx" ON "category_templates" USING btree ("budget_id");--> statement-breakpoint
CREATE INDEX "category_templates_name_group_idx" ON "category_templates" USING btree ("budget_id","name","group_name");--> statement-breakpoint
ALTER TABLE "budget_categories" ADD CONSTRAINT "budget_categories_template_id_category_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."category_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "budget_categories_template_id_idx" ON "budget_categories" USING btree ("template_id");