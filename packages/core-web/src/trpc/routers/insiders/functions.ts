import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import type { Context } from "@starter/core-web/src/trpc/context";
import { insiders, issuers, transactions } from "@starter/core/src/sql/schema";
import {
	getIssuerByTicker,
	getRecentHighScoreTransactions,
	searchTickers,
} from "@starter/core/src/sql/queries/insiders";
import type {
	GetTickerStatsInput,
	GetTransactionInput,
	ListTransactionsInput,
	SearchTickersInput,
} from "./schema";

/**
 * List transactions with optional filters
 */
export async function listTransactions({ ctx, input }: { ctx: Context; input: ListTransactionsInput }) {
	const { ticker, startDate, endDate, minScore, limit, offset } = input;

	// Build query conditions
	const conditions: any[] = [];

	// Filter by ticker if provided
	if (ticker) {
		const issuer = await getIssuerByTicker(ctx.db, ticker);
		if (issuer) {
			conditions.push(eq(transactions.issuerId, issuer.id));
		} else {
			// No issuer found for ticker
			return {
				transactions: [],
				total: 0,
			};
		}
	}

	// Filter by date range
	if (startDate) {
		conditions.push(gte(transactions.transactionDate, startDate));
	}
	if (endDate) {
		conditions.push(lte(transactions.transactionDate, endDate));
	}

	// Filter by minimum score
	if (minScore !== undefined) {
		conditions.push(sql`ABS(${transactions.signalScore}) >= ${minScore}`);
	}

	// Get total count
	const [countResult] = await ctx.db
		.select({ count: sql<number>`COUNT(*)` })
		.from(transactions)
		.where(conditions.length > 0 ? and(...conditions) : undefined);

	const total = Number(countResult?.count || 0);

	// Get transactions with issuer and insider data
	const results = await ctx.db
		.select({
			id: transactions.id,
			filingAccession: transactions.filingAccession,
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
			issuer: {
				id: issuers.id,
				cik: issuers.cik,
				ticker: issuers.ticker,
				companyName: issuers.companyName,
			},
			insider: {
				id: insiders.id,
				name: insiders.name,
				title: insiders.title,
			},
		})
		.from(transactions)
		.innerJoin(issuers, eq(transactions.issuerId, issuers.id))
		.innerJoin(insiders, eq(transactions.insiderId, insiders.id))
		.where(conditions.length > 0 ? and(...conditions) : undefined)
		.orderBy(desc(transactions.transactionDate), desc(sql`ABS(${transactions.signalScore})`))
		.limit(limit)
		.offset(offset);

	return {
		transactions: results,
		total,
		hasMore: offset + limit < total,
	};
}

/**
 * Get detailed transaction information
 */
export async function getTransaction({ ctx, input }: { ctx: Context; input: GetTransactionInput }) {
	const [result] = await ctx.db
		.select({
			id: transactions.id,
			filingAccession: transactions.filingAccession,
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
			issuer: {
				id: issuers.id,
				cik: issuers.cik,
				ticker: issuers.ticker,
				companyName: issuers.companyName,
			},
			insider: {
				id: insiders.id,
				name: insiders.name,
				title: insiders.title,
			},
		})
		.from(transactions)
		.innerJoin(issuers, eq(transactions.issuerId, issuers.id))
		.innerJoin(insiders, eq(transactions.insiderId, insiders.id))
		.where(eq(transactions.id, input.id))
		.limit(1);

	if (!result) {
		throw new Error("Transaction not found");
	}

	return result;
}

/**
 * Get ticker statistics and recent activity
 */
export async function getTickerStats({ ctx, input }: { ctx: Context; input: GetTickerStatsInput }) {
	const { ticker, daysBack } = input;

	// Get issuer
	const issuer = await getIssuerByTicker(ctx.db, ticker);
	if (!issuer) {
		throw new Error("Ticker not found");
	}

	// Calculate date range
	const endDate = new Date();
	const startDate = new Date();
	startDate.setDate(startDate.getDate() - daysBack);
	const startDateStr = startDate.toISOString().split("T")[0];

	// Get transactions in date range
	const txList = await ctx.db
		.select({
			id: transactions.id,
			transactionDate: transactions.transactionDate,
			transactionCode: transactions.transactionCode,
			shares: transactions.shares,
			price: transactions.price,
			transactionValue: transactions.transactionValue,
			signalScore: transactions.signalScore,
			insider: {
				id: insiders.id,
				name: insiders.name,
				title: insiders.title,
			},
		})
		.from(transactions)
		.innerJoin(insiders, eq(transactions.insiderId, insiders.id))
		.where(and(eq(transactions.issuerId, issuer.id), gte(transactions.transactionDate, startDateStr)))
		.orderBy(desc(transactions.transactionDate));

	// Calculate aggregate stats
	const buyCount = txList.filter((tx) => tx.transactionCode === "P").length;
	const sellCount = txList.filter((tx) => tx.transactionCode === "S").length;
	const totalValue = txList.reduce((sum, tx) => sum + Number(tx.transactionValue), 0);
	const avgScore =
		txList.length > 0
			? txList.reduce((sum, tx) => sum + Number(tx.signalScore), 0) / txList.length
			: 0;

	return {
		issuer: {
			id: issuer.id,
			cik: issuer.cik,
			ticker: issuer.ticker,
			companyName: issuer.companyName,
		},
		stats: {
			daysBack,
			totalTransactions: txList.length,
			buyCount,
			sellCount,
			totalValue,
			avgScore: Number(avgScore.toFixed(2)),
		},
		recentTransactions: txList.slice(0, 20), // Return top 20 most recent
	};
}

/**
 * Get recent high-score transactions for dashboard homepage
 */
export async function getRecentHighlights({ ctx }: { ctx: Context }) {
	const transactions = await getRecentHighScoreTransactions(ctx.db, 7, 2.0, 25);

	return {
		transactions,
	};
}

/**
 * Search for tickers by symbol or company name
 */
export async function searchForTickers({ ctx, input }: { ctx: Context; input: SearchTickersInput }) {
	const results = await searchTickers(ctx.db, input.query, input.limit);

	return {
		tickers: results,
	};
}
