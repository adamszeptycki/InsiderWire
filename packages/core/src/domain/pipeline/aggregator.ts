import type { PgDatabase } from "drizzle-orm/pg-core";
import type { Insider, Issuer, Transaction } from "../../sql/schema";
import { getDailyTransactionsByDate, recordSlackAlert } from "../../sql/queries/insiders";
import { createSlackClient, formatDailyDigest } from "../slack";

export interface DigestStats {
	date: string;
	transactionsProcessed: number;
	tickersIncluded: number;
	digestPosted: boolean;
	error?: string;
}

/**
 * Daily digest aggregator
 * Groups transactions by ticker and posts a daily summary to Slack
 */
export class DailyDigestAggregator {
	private db: PgDatabase<any, any, any>;
	private slackClient = createSlackClient();

	constructor(db: PgDatabase<any, any, any>) {
		this.db = db;
	}

	/**
	 * Generate and post daily digest for a specific date
	 * @param date ISO date string (YYYY-MM-DD)
	 * @returns Digest statistics
	 */
	async generateDigest(date: string): Promise<DigestStats> {
		const stats: DigestStats = {
			date,
			transactionsProcessed: 0,
			tickersIncluded: 0,
			digestPosted: false,
		};

		try {
			console.log(`[DigestAggregator] Generating digest for ${date}...`);

			// Fetch all transactions for the date
			const transactions = await getDailyTransactionsByDate(this.db, date);

			if (transactions.length === 0) {
				console.log(`[DigestAggregator] No transactions found for ${date}`);
				return stats;
			}

			stats.transactionsProcessed = transactions.length;

			// Group transactions by ticker
			const transactionsByTicker = this.groupByTicker(transactions);
			stats.tickersIncluded = transactionsByTicker.size;

			// Format and post digest
			const message = formatDailyDigest(date, transactionsByTicker);
			const response = await this.slackClient.postMessage(message);

			if (response.ok) {
				stats.digestPosted = true;

				// Record digest alerts for each transaction
				for (const transaction of transactions) {
					try {
						await recordSlackAlert(this.db, {
							transactionId: transaction.id,
							issuerId: transaction.issuerId,
							alertType: "digest",
							slackMessageTs: response.ts,
							slackThreadTs: response.ts,
							postedAt: new Date(),
						});
					} catch (error) {
						// Continue even if recording fails
						console.error(
							`[DigestAggregator] Failed to record alert for transaction ${transaction.id}:`,
							error,
						);
					}
				}

				console.log(
					`[DigestAggregator] Posted digest for ${date}: ${transactions.length} transactions across ${transactionsByTicker.size} tickers`,
				);
			} else {
				stats.error = response.error;
				console.error(`[DigestAggregator] Failed to post digest: ${response.error}`);
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : "Unknown error";
			stats.error = errorMessage;
			console.error(`[DigestAggregator] Error generating digest for ${date}:`, errorMessage);
		}

		return stats;
	}

	/**
	 * Generate digest for yesterday (most common use case)
	 */
	async generateYesterdayDigest(): Promise<DigestStats> {
		const yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1);
		const dateStr = yesterday.toISOString().split("T")[0];

		return this.generateDigest(dateStr);
	}

	/**
	 * Group transactions by ticker symbol
	 */
	private groupByTicker(
		transactions: Array<Transaction & { issuer: Issuer; insider: Insider }>,
	): Map<string, Array<Transaction & { issuer: Issuer; insider: Insider }>> {
		const grouped = new Map<
			string,
			Array<Transaction & { issuer: Issuer; insider: Insider }>
		>();

		for (const tx of transactions) {
			const ticker = tx.issuer.ticker || tx.issuer.companyName;

			if (!grouped.has(ticker)) {
				grouped.set(ticker, []);
			}

			grouped.get(ticker)?.push(tx);
		}

		return grouped;
	}
}

/**
 * Create a daily digest aggregator instance
 */
export function createDailyDigestAggregator(
	db: PgDatabase<any, any, any>,
): DailyDigestAggregator {
	return new DailyDigestAggregator(db);
}
