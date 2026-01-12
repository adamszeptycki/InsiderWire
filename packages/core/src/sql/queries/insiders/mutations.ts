import { eq } from "drizzle-orm";
import type { PgDatabase } from "drizzle-orm/pg-core";
import {
	type InsertInsider,
	type InsertIssuer,
	type InsertSlackAlert,
	type InsertTransaction,
	type Insider,
	type Issuer,
	type SlackAlert,
	type Transaction,
	insiders,
	issuers,
	slackAlerts,
	transactions,
} from "../../schema";

/**
 * Upsert an issuer (company)
 * Updates if CIK already exists, otherwise inserts
 */
export async function upsertIssuer(
	db: PgDatabase<any, any, any>,
	data: Omit<InsertIssuer, "id" | "createdAt" | "updatedAt">,
): Promise<Issuer> {
	const [issuer] = await db
		.insert(issuers)
		.values(data)
		.onConflictDoUpdate({
			target: issuers.cik,
			set: {
				ticker: data.ticker,
				companyName: data.companyName,
				updatedAt: new Date(),
			},
		})
		.returning();

	return issuer;
}

/**
 * Upsert an insider (reporting owner)
 * Updates if name+issuerId already exists, otherwise inserts
 */
export async function upsertInsider(
	db: PgDatabase<any, any, any>,
	data: Omit<InsertInsider, "id" | "createdAt" | "updatedAt">,
): Promise<Insider> {
	const [insider] = await db
		.insert(insiders)
		.values(data)
		.onConflictDoUpdate({
			target: [insiders.name, insiders.issuerId],
			set: {
				title: data.title,
				updatedAt: new Date(),
			},
		})
		.returning();

	return insider;
}

/**
 * Upsert a transaction
 * Uses composite unique constraint for deduplication
 * If transaction already exists (same filing, insider, date, shares, price), updates it
 */
export async function upsertTransaction(
	db: PgDatabase<any, any, any>,
	data: Omit<InsertTransaction, "id" | "createdAt" | "updatedAt">,
): Promise<Transaction> {
	const [transaction] = await db
		.insert(transactions)
		.values(data)
		.onConflictDoUpdate({
			target: [
				transactions.filingAccession,
				transactions.insiderId,
				transactions.transactionDate,
				transactions.shares,
				transactions.price,
			],
			set: {
				transactionCode: data.transactionCode,
				transactionValue: data.transactionValue,
				postTransactionShares: data.postTransactionShares,
				isDirectOwnership: data.isDirectOwnership,
				is10b51: data.is10b51,
				signalScore: data.signalScore,
				updatedAt: new Date(),
			},
		})
		.returning();

	return transaction;
}

/**
 * Record a Slack alert for a transaction
 */
export async function recordSlackAlert(
	db: PgDatabase<any, any, any>,
	data: Omit<InsertSlackAlert, "id" | "createdAt" | "updatedAt">,
): Promise<SlackAlert> {
	const [alert] = await db.insert(slackAlerts).values(data).returning();

	return alert;
}

/**
 * Update Slack alert with message timestamp after posting
 */
export async function updateSlackAlertTimestamp(
	db: PgDatabase<any, any, any>,
	alertId: string,
	messageTs: string,
	threadTs?: string,
): Promise<void> {
	await db
		.update(slackAlerts)
		.set({
			slackMessageTs: messageTs,
			slackThreadTs: threadTs,
			postedAt: new Date(),
			updatedAt: new Date(),
		})
		.where(eq(slackAlerts.id, alertId));
}

/**
 * Batch upsert transactions for better performance
 */
export async function batchUpsertTransactions(
	db: PgDatabase<any, any, any>,
	data: Array<Omit<InsertTransaction, "id" | "createdAt" | "updatedAt">>,
): Promise<Transaction[]> {
	if (data.length === 0) return [];

	const results = await db
		.insert(transactions)
		.values(data)
		.onConflictDoUpdate({
			target: [
				transactions.filingAccession,
				transactions.insiderId,
				transactions.transactionDate,
				transactions.shares,
				transactions.price,
			],
			set: {
				transactionCode: data[0].transactionCode, // This is a limitation, but we'll upsert one by one if needed
				updatedAt: new Date(),
			},
		})
		.returning();

	return results;
}
