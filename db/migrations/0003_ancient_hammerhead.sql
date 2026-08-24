ALTER TABLE "reviews" ALTER COLUMN "item_id" SET DATA TYPE text;--> statement-breakpoint
CREATE UNIQUE INDEX "reviews_user_item_idx" ON "reviews" USING btree ("user_id","item_type","item_id");