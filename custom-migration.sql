CREATE TABLE IF NOT EXISTS "app_config" (
	"key" varchar(100) PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "day_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" date NOT NULL,
	"slot_time" time,
	"max_guests" integer,
	"is_blocked" boolean DEFAULT false NOT NULL,
	"block_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

DO $$ BEGIN
    ALTER TABLE "bookings" ADD COLUMN "category" varchar(50) DEFAULT 'individual' NOT NULL;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "bookings" ADD COLUMN "organisation_name" varchar(255);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "bookings" ADD COLUMN "visited" boolean DEFAULT false NOT NULL;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    CREATE UNIQUE INDEX "day_settings_date_uniq" ON "day_settings" USING btree ("date");
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;
