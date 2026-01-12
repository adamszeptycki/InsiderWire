import { defaultFields } from "@starter/core/src/sql/utils";
import {
	boolean,
	date,
	decimal,
	index,
	pgTable,
	text,
	timestamp,
	unique,
	uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

// Issuers table - companies that file Form 4
export const issuers = pgTable(
	"issuers",
	{
		...defaultFields,
		cik: text("cik").notNull().unique(), // SEC Central Index Key
		ticker: text("ticker"), // Stock ticker symbol (nullable as some filings may not have it)
		companyName: text("company_name").notNull(),
	},
	(table) => [index("issuers_cik_idx").on(table.cik), index("issuers_ticker_idx").on(table.ticker)],
);

export type Issuer = typeof issuers.$inferSelect;
export type InsertIssuer = typeof issuers.$inferInsert;
export const IssuerSchema = createSelectSchema(issuers);
export const InsertIssuerSchema = createInsertSchema(issuers).omit({ id: true });

// Insiders table - reporting owners (identity scoped per issuer)
export const insiders = pgTable(
	"insiders",
	{
		...defaultFields,
		issuerId: uuid("issuer_id")
			.notNull()
			.references(() => issuers.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		title: text("title"), // Job title (nullable)
	},
	(table) => [
		unique("insiders_name_issuer_unique").on(table.name, table.issuerId),
		index("insiders_issuer_idx").on(table.issuerId),
	],
);

export type Insider = typeof insiders.$inferSelect;
export type InsertInsider = typeof insiders.$inferInsert;
export const InsiderSchema = createSelectSchema(insiders);
export const InsertInsiderSchema = createInsertSchema(insiders).omit({ id: true });

// Transactions table - individual Form 4 transactions
export const transactions = pgTable(
	"transactions",
	{
		...defaultFields,
		filingAccession: text("filing_accession").notNull(), // SEC accession number
		insiderId: uuid("insider_id")
			.notNull()
			.references(() => insiders.id, { onDelete: "cascade" }),
		issuerId: uuid("issuer_id")
			.notNull()
			.references(() => issuers.id, { onDelete: "cascade" }),
		transactionDate: date("transaction_date").notNull(), // Date of transaction
		transactionCode: text("transaction_code").notNull(), // 'P' = buy, 'S' = sell
		shares: decimal("shares", { precision: 20, scale: 4 }).notNull(),
		price: decimal("price", { precision: 20, scale: 4 }).notNull(),
		transactionValue: decimal("transaction_value", { precision: 20, scale: 2 }).notNull(), // shares * price
		postTransactionShares: decimal("post_transaction_shares", { precision: 20, scale: 4 }).notNull(), // Holdings after transaction
		isDirectOwnership: boolean("is_direct_ownership").notNull().default(true),
		is10b51: boolean("is_10b5_1").notNull().default(false), // Parsed from footnotes
		signalScore: decimal("signal_score", { precision: 10, scale: 2 }).notNull().default("0"), // Calculated signal score
	},
	(table) => [
		// Dedupe constraint per specs
		unique("transactions_dedupe").on(
			table.filingAccession,
			table.insiderId,
			table.transactionDate,
			table.shares,
			table.price,
		),
		index("transactions_filing_idx").on(table.filingAccession),
		index("transactions_date_idx").on(table.transactionDate),
		index("transactions_issuer_idx").on(table.issuerId),
		index("transactions_insider_idx").on(table.insiderId),
		index("transactions_issuer_date_idx").on(table.issuerId, table.transactionDate),
	],
);

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;
export const TransactionSchema = createSelectSchema(transactions);
export const InsertTransactionSchema = createInsertSchema(transactions).omit({ id: true });

// Slack alerts table - tracks what has been posted to Slack
export const slackAlerts = pgTable(
	"slack_alerts",
	{
		...defaultFields,
		transactionId: uuid("transaction_id")
			.notNull()
			.references(() => transactions.id, { onDelete: "cascade" }),
		issuerId: uuid("issuer_id")
			.notNull()
			.references(() => issuers.id, { onDelete: "cascade" }),
		alertType: text("alert_type").notNull(), // 'urgent' or 'digest'
		slackThreadTs: text("slack_thread_ts"), // Slack thread timestamp for threading
		slackMessageTs: text("slack_message_ts"), // Slack message timestamp
		postedAt: timestamp("posted_at"), // When the alert was posted
	},
	(table) => [
		index("slack_alerts_transaction_idx").on(table.transactionId),
		index("slack_alerts_issuer_date_idx").on(table.issuerId, table.createdAt),
	],
);

export type SlackAlert = typeof slackAlerts.$inferSelect;
export type InsertSlackAlert = typeof slackAlerts.$inferInsert;
export const SlackAlertSchema = createSelectSchema(slackAlerts);
export const InsertSlackAlertSchema = createInsertSchema(slackAlerts).omit({ id: true });
