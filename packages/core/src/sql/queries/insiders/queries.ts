import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import type { PgDatabase } from "drizzle-orm/pg-core";
import type { Insider, Issuer, Transaction } from "../../schema";
import { insiders, issuers, slackAlerts, transactions } from "../../schema";

/**
 * Get an issuer by CIK
 */
export async function getIssuerByCik(
	db: PgDatabase<any, any, any>,
	cik: string,
): Promise<Issuer | null> {
	const [issuer] = await db.select().from(issuers).where(eq(issuers.cik, cik)).limit(1);

	return issuer || null;
}

/**
 * Get an issuer by ticker
 */
export async function getIssuerByTicker(
	db: PgDatabase<any, any, any>,
	ticker: string,
): Promise<Issuer | null> {
	const [issuer] = await db.select().from(issuers).where(eq(issuers.ticker, ticker)).limit(1);

	return issuer || null;
}

/**
 * Get an insider by name and issuer ID
 */
export async function getInsiderByNameAndIssuer(
	db: PgDatabase<any, any, any>,
	name: string,
	issuerId: string,
): Promise<Insider | null> {
	const [insider] = await db
		.select()
		.from(insiders)
		.where(and(eq(insiders.name, name), eq(insiders.issuerId, issuerId)))
		.limit(1);

	return insider || null;
}

/**
 * Get insider's last transaction date
 * Used to determine if this is their first activity in 180+ days
 */
export async function getInsiderLastTransactionDate(
	db: PgDatabase<any, any, any>,
	insiderId: string,
	beforeDate: string,
): Promise<string | null> {
	const [result] = await db
		.select({
			transactionDate: transactions.transactionDate,
		})
		.from(transactions)
		.where(and(eq(transactions.insiderId, insiderId), lte(transactions.transactionDate, beforeDate)))
		.orderBy(desc(transactions.transactionDate))
		.limit(1);

	return result?.transactionDate || null;
}

/**
 * Get recent transactions by ticker within a date range
 * Used for cluster detection (finding multiple insiders trading same ticker within 7 days)
 */
export async function getRecentTransactionsByTicker(
	db: PgDatabase<any, any, any>,
	issuerId: string,
	startDate: string,
	endDate: string,
): Promise<Transaction[]> {
	return db
		.select()
		.from(transactions)
		.where(
			and(
				eq(transactions.issuerId, issuerId),
				gte(transactions.transactionDate, startDate),
				lte(transactions.transactionDate, endDate),
			),
		)
		.orderBy(desc(transactions.transactionDate));
}

/**
 * Get distinct insider count trading same ticker within date range
 * Used for cluster bonus calculation
 */
export async function getDistinctInsiderCountInCluster(
	db: PgDatabase<any, any, any>,
	issuerId: string,
	startDate: string,
	endDate: string,
	excludeInsiderId?: string,
): Promise<number> {
	const conditions = [
		eq(transactions.issuerId, issuerId),
		gte(transactions.transactionDate, startDate),
		lte(transactions.transactionDate, endDate),
	];

	if (excludeInsiderId) {
		conditions.push(sql`${transactions.insiderId} != ${excludeInsiderId}`);
	}

	const [result] = await db
		.select({
			count: sql<number>`COUNT(DISTINCT ${transactions.insiderId})`,
		})
		.from(transactions)
		.where(and(...conditions));

	return Number(result?.count || 0);
}

/**
 * Get insider's holdings history (previous transaction)
 * Used to calculate holdings delta percentage
 */
export async function getInsiderPreviousTransaction(
	db: PgDatabase<any, any, any>,
	insiderId: string,
	beforeDate: string,
): Promise<Transaction | null> {
	const [transaction] = await db
		.select()
		.from(transactions)
		.where(and(eq(transactions.insiderId, insiderId), lte(transactions.transactionDate, beforeDate)))
		.orderBy(desc(transactions.transactionDate))
		.limit(1);

	return transaction || null;
}

/**
 * Get daily transactions grouped by ticker for digest
 * Used to build the daily digest message
 */
export async function getDailyTransactionsByDate(
	db: PgDatabase<any, any, any>,
	date: string,
): Promise<Array<Transaction & { issuer: Issuer; insider: Insider }>> {
	return db
		.select({
			id: transactions.id,
			filingAccession: transactions.filingAccession,
			insiderId: transactions.insiderId,
			issuerId: transactions.issuerId,
			transactionDate: transactions.transactionDate,
			transactionCode: transactions.transactionCode,
			shares: transactions.shares,
			price: transactions.price,
			transactionValue: transactions.transactionValue,
			postTransactionShares: transactions.postTransactionShares,
			isDirectOwnership: transactions.isDirectOwnership,
			is10b51: transactions.is10b51,
			signalScore: transactions.signalScore,
			createdAt: transactions.createdAt,
			updatedAt: transactions.updatedAt,
			issuer: issuers,
			insider: insiders,
		})
		.from(transactions)
		.innerJoin(issuers, eq(transactions.issuerId, issuers.id))
		.innerJoin(insiders, eq(transactions.insiderId, insiders.id))
		.where(eq(transactions.transactionDate, date))
		.orderBy(desc(transactions.signalScore));
}

/**
 * Get transactions for a specific ticker with context (90 days)
 * Used for dashboard ticker view
 */
export async function getTransactionsByTicker(
	db: PgDatabase<any, any, any>,
	issuerId: string,
	startDate: string,
	limit = 100,
): Promise<Array<Transaction & { insider: Insider }>> {
	return db
		.select({
			id: transactions.id,
			filingAccession: transactions.filingAccession,
			insiderId: transactions.insiderId,
			issuerId: transactions.issuerId,
			transactionDate: transactions.transactionDate,
			transactionCode: transactions.transactionCode,
			shares: transactions.shares,
			price: transactions.price,
			transactionValue: transactions.transactionValue,
			postTransactionShares: transactions.postTransactionShares,
			isDirectOwnership: transactions.isDirectOwnership,
			is10b51: transactions.is10b51,
			signalScore: transactions.signalScore,
			createdAt: transactions.createdAt,
			updatedAt: transactions.updatedAt,
			insider: insiders,
		})
		.from(transactions)
		.innerJoin(insiders, eq(transactions.insiderId, insiders.id))
		.where(and(eq(transactions.issuerId, issuerId), gte(transactions.transactionDate, startDate)))
		.orderBy(desc(transactions.transactionDate))
		.limit(limit);
}

/**
 * Get recent high-score transactions for dashboard
 */
export async function getRecentHighScoreTransactions(
	db: PgDatabase<any, any, any>,
	daysBack = 7,
	minScore = 2.0,
	limit = 50,
): Promise<Array<Transaction & { issuer: Issuer; insider: Insider }>> {
	const startDate = new Date();
	startDate.setDate(startDate.getDate() - daysBack);
	const startDateStr = startDate.toISOString().split("T")[0];

	return db
		.select({
			id: transactions.id,
			filingAccession: transactions.filingAccession,
			insiderId: transactions.insiderId,
			issuerId: transactions.issuerId,
			transactionDate: transactions.transactionDate,
			transactionCode: transactions.transactionCode,
			shares: transactions.shares,
			price: transactions.price,
			transactionValue: transactions.transactionValue,
			postTransactionShares: transactions.postTransactionShares,
			isDirectOwnership: transactions.isDirectOwnership,
			is10b51: transactions.is10b51,
			signalScore: transactions.signalScore,
			createdAt: transactions.createdAt,
			updatedAt: transactions.updatedAt,
			issuer: issuers,
			insider: insiders,
		})
		.from(transactions)
		.innerJoin(issuers, eq(transactions.issuerId, issuers.id))
		.innerJoin(insiders, eq(transactions.insiderId, insiders.id))
		.where(
			and(
				gte(transactions.transactionDate, startDateStr),
				sql`ABS(${transactions.signalScore}) >= ${minScore}`,
			),
		)
		.orderBy(desc(sql`ABS(${transactions.signalScore})`), desc(transactions.transactionDate))
		.limit(limit);
}

/**
 * Check if we've already alerted on a transaction
 */
export async function hasSlackAlertForTransaction(
	db: PgDatabase<any, any, any>,
	transactionId: string,
	alertType: "urgent" | "digest",
): Promise<boolean> {
	const [alert] = await db
		.select()
		.from(slackAlerts)
		.where(
			and(eq(slackAlerts.transactionId, transactionId), eq(slackAlerts.alertType, alertType)),
		)
		.limit(1);

	return !!alert;
}

/**
 * Search tickers by symbol or company name
 */
export async function searchTickers(
	db: PgDatabase<any, any, any>,
	searchTerm: string,
	limit = 10,
): Promise<Issuer[]> {
	const searchPattern = `%${searchTerm.toUpperCase()}%`;

	return db
		.select()
		.from(issuers)
		.where(
			sql`UPPER(${issuers.ticker}) LIKE ${searchPattern} OR UPPER(${issuers.companyName}) LIKE ${searchPattern}`,
		)
		.limit(limit);
}
