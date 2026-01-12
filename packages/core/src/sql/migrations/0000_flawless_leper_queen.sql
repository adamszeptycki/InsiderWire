CREATE TYPE "public"."tenantType" AS ENUM('company', 'individual');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('member', 'admin', 'owner', 'viewer');--> statement-breakpoint
CREATE TABLE "account" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text
);
--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"organization_id" uuid NOT NULL,
	"email" text NOT NULL,
	"role" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"inviter_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "role" DEFAULT 'member' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"domain" text,
	"type" text,
	"name" text NOT NULL,
	"slug" text,
	"logo" text,
	"is_placeholder" boolean DEFAULT true NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp with time zone,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" uuid NOT NULL,
	"impersonated_by" text,
	"active_organization_id" uuid,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" text DEFAULT 'user',
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" uuid PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "insiders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"issuer_id" uuid NOT NULL,
	"name" text NOT NULL,
	"title" text,
	CONSTRAINT "insiders_name_issuer_unique" UNIQUE("name","issuer_id")
);
--> statement-breakpoint
CREATE TABLE "issuers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"cik" text NOT NULL,
	"ticker" text,
	"company_name" text NOT NULL,
	CONSTRAINT "issuers_cik_unique" UNIQUE("cik")
);
--> statement-breakpoint
CREATE TABLE "slack_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"transaction_id" uuid NOT NULL,
	"issuer_id" uuid NOT NULL,
	"alert_type" text NOT NULL,
	"slack_thread_ts" text,
	"slack_message_ts" text,
	"posted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"filing_accession" text NOT NULL,
	"insider_id" uuid NOT NULL,
	"issuer_id" uuid NOT NULL,
	"transaction_date" date NOT NULL,
	"transaction_code" text NOT NULL,
	"shares" numeric(20, 4) NOT NULL,
	"price" numeric(20, 4) NOT NULL,
	"transaction_value" numeric(20, 2) NOT NULL,
	"post_transaction_shares" numeric(20, 4) NOT NULL,
	"is_direct_ownership" boolean DEFAULT true NOT NULL,
	"is_10b5_1" boolean DEFAULT false NOT NULL,
	"signal_score" numeric(10, 2) DEFAULT '0' NOT NULL,
	CONSTRAINT "transactions_dedupe" UNIQUE("filing_accession","insider_id","transaction_date","shares","price")
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_inviter_id_user_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_active_organization_id_organizations_id_fk" FOREIGN KEY ("active_organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insiders" ADD CONSTRAINT "insiders_issuer_id_issuers_id_fk" FOREIGN KEY ("issuer_id") REFERENCES "public"."issuers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slack_alerts" ADD CONSTRAINT "slack_alerts_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slack_alerts" ADD CONSTRAINT "slack_alerts_issuer_id_issuers_id_fk" FOREIGN KEY ("issuer_id") REFERENCES "public"."issuers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_insider_id_insiders_id_fk" FOREIGN KEY ("insider_id") REFERENCES "public"."insiders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_issuer_id_issuers_id_fk" FOREIGN KEY ("issuer_id") REFERENCES "public"."issuers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "insiders_issuer_idx" ON "insiders" USING btree ("issuer_id");--> statement-breakpoint
CREATE INDEX "issuers_cik_idx" ON "issuers" USING btree ("cik");--> statement-breakpoint
CREATE INDEX "issuers_ticker_idx" ON "issuers" USING btree ("ticker");--> statement-breakpoint
CREATE INDEX "slack_alerts_transaction_idx" ON "slack_alerts" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "slack_alerts_issuer_date_idx" ON "slack_alerts" USING btree ("issuer_id","created_at");--> statement-breakpoint
CREATE INDEX "transactions_filing_idx" ON "transactions" USING btree ("filing_accession");--> statement-breakpoint
CREATE INDEX "transactions_date_idx" ON "transactions" USING btree ("transaction_date");--> statement-breakpoint
CREATE INDEX "transactions_issuer_idx" ON "transactions" USING btree ("issuer_id");--> statement-breakpoint
CREATE INDEX "transactions_insider_idx" ON "transactions" USING btree ("insider_id");--> statement-breakpoint
CREATE INDEX "transactions_issuer_date_idx" ON "transactions" USING btree ("issuer_id","transaction_date");