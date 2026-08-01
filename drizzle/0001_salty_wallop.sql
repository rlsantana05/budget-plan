CREATE TYPE "public"."move_type" AS ENUM('ASSIGN', 'MOVE_IN', 'MOVE_OUT', 'CREDIT_SPEND', 'CARD_PAYMENT');--> statement-breakpoint
CREATE TYPE "public"."transaction_status" AS ENUM('NEW', 'TRACKED', 'DELETED');--> statement-breakpoint
CREATE TABLE "assignment_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"month_budget_id" uuid NOT NULL,
	"paycheck_id" uuid,
	"category_id" uuid NOT NULL,
	"move_id" uuid,
	"amount" numeric(12, 2) NOT NULL,
	"move_type" "move_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "budget_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"name" text NOT NULL,
	"due_date" timestamp with time zone,
	"planned" numeric(12, 2) DEFAULT '0' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_payment_category" boolean DEFAULT false NOT NULL,
	"account_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "category_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"month_budget_id" uuid NOT NULL,
	"name" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"right_column" text DEFAULT 'Spent' NOT NULL,
	"collapsed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "category_rollups" (
	"month_budget_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"assigned" numeric(12, 2) DEFAULT '0' NOT NULL,
	"activity" numeric(12, 2) DEFAULT '0' NOT NULL,
	"available" numeric(12, 2) DEFAULT '0' NOT NULL,
	"assigned_from_credit" numeric(12, 2) DEFAULT '0' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "category_rollups_month_budget_id_category_id_pk" PRIMARY KEY("month_budget_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "month_budgets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"budget_id" uuid NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "paychecks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"month_budget_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"date" timestamp with time zone DEFAULT now() NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"month_budget_id" uuid NOT NULL,
	"account_id" uuid,
	"category_id" uuid,
	"amount" numeric(12, 2) NOT NULL,
	"date" timestamp with time zone DEFAULT now() NOT NULL,
	"payee" text,
	"memo" text,
	"cleared" boolean DEFAULT false NOT NULL,
	"status" "transaction_status" DEFAULT 'NEW' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "assignment_ledger" ADD CONSTRAINT "assignment_ledger_month_budget_id_month_budgets_id_fk" FOREIGN KEY ("month_budget_id") REFERENCES "public"."month_budgets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment_ledger" ADD CONSTRAINT "assignment_ledger_paycheck_id_paychecks_id_fk" FOREIGN KEY ("paycheck_id") REFERENCES "public"."paychecks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment_ledger" ADD CONSTRAINT "assignment_ledger_category_id_budget_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."budget_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_categories" ADD CONSTRAINT "budget_categories_group_id_category_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."category_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_categories" ADD CONSTRAINT "budget_categories_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_groups" ADD CONSTRAINT "category_groups_month_budget_id_month_budgets_id_fk" FOREIGN KEY ("month_budget_id") REFERENCES "public"."month_budgets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_rollups" ADD CONSTRAINT "category_rollups_month_budget_id_month_budgets_id_fk" FOREIGN KEY ("month_budget_id") REFERENCES "public"."month_budgets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_rollups" ADD CONSTRAINT "category_rollups_category_id_budget_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."budget_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "month_budgets" ADD CONSTRAINT "month_budgets_budget_id_budgets_id_fk" FOREIGN KEY ("budget_id") REFERENCES "public"."budgets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paychecks" ADD CONSTRAINT "paychecks_month_budget_id_month_budgets_id_fk" FOREIGN KEY ("month_budget_id") REFERENCES "public"."month_budgets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paychecks" ADD CONSTRAINT "paychecks_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_month_budget_id_month_budgets_id_fk" FOREIGN KEY ("month_budget_id") REFERENCES "public"."month_budgets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_category_id_budget_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."budget_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "assignment_ledger_month_budget_id_idx" ON "assignment_ledger" USING btree ("month_budget_id");--> statement-breakpoint
CREATE INDEX "assignment_ledger_paycheck_id_idx" ON "assignment_ledger" USING btree ("paycheck_id");--> statement-breakpoint
CREATE INDEX "assignment_ledger_category_id_idx" ON "assignment_ledger" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "assignment_ledger_move_id_idx" ON "assignment_ledger" USING btree ("move_id");--> statement-breakpoint
CREATE INDEX "budget_categories_group_id_idx" ON "budget_categories" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "budget_categories_account_id_idx" ON "budget_categories" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "budget_categories_due_date_idx" ON "budget_categories" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "category_groups_month_budget_id_idx" ON "category_groups" USING btree ("month_budget_id");--> statement-breakpoint
CREATE INDEX "category_groups_sort_order_idx" ON "category_groups" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "category_rollups_category_id_idx" ON "category_rollups" USING btree ("category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "month_budgets_budget_year_month_unique" ON "month_budgets" USING btree ("budget_id","year","month");--> statement-breakpoint
CREATE INDEX "month_budgets_budget_id_idx" ON "month_budgets" USING btree ("budget_id");--> statement-breakpoint
CREATE INDEX "month_budgets_year_month_idx" ON "month_budgets" USING btree ("year","month");--> statement-breakpoint
CREATE INDEX "month_budgets_deleted_at_idx" ON "month_budgets" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "paychecks_month_budget_id_idx" ON "paychecks" USING btree ("month_budget_id");--> statement-breakpoint
CREATE INDEX "paychecks_account_id_idx" ON "paychecks" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "paychecks_date_idx" ON "paychecks" USING btree ("date");--> statement-breakpoint
CREATE INDEX "transactions_month_budget_id_idx" ON "transactions" USING btree ("month_budget_id");--> statement-breakpoint
CREATE INDEX "transactions_account_id_idx" ON "transactions" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "transactions_category_id_idx" ON "transactions" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "transactions_status_idx" ON "transactions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "transactions_date_idx" ON "transactions" USING btree ("date");