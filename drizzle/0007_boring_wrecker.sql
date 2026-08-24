CREATE TABLE "closed_weeks" (
	"month_budget_id" uuid NOT NULL,
	"week_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "closed_weeks_month_budget_id_week_key_pk" PRIMARY KEY("month_budget_id","week_key")
);
--> statement-breakpoint
ALTER TABLE "closed_weeks" ADD CONSTRAINT "closed_weeks_month_budget_id_month_budgets_id_fk" FOREIGN KEY ("month_budget_id") REFERENCES "public"."month_budgets"("id") ON DELETE cascade ON UPDATE no action;