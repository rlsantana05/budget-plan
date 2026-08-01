ALTER TABLE "paychecks" ADD COLUMN "transaction_id" uuid;--> statement-breakpoint
ALTER TABLE "paychecks" ADD CONSTRAINT "paychecks_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "paychecks_transaction_id_idx" ON "paychecks" USING btree ("transaction_id");