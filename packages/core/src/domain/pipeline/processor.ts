import type { PgDatabase } from "drizzle-orm/pg-core";
import { createForm4Parser, createSECEdgarClient } from "../sec";
import type { Form4Data } from "../sec/types";
import { TRANSACTION_CODE_BUY, TRANSACTION_CODE_SELL } from "../sec/types";
import {
	type ScoreInput,
	calculateHoldingsDelta,
	calculateSignalScore,
	shouldTriggerUrgentAlert,
} from "../scoring";
import { CLUSTER_DETECTION_DAYS, FIRST_ACTIVITY_DAYS } from "../scoring/rules";
import { createSlackClient, formatUrgentAlert } from "../slack";
import {
	getDistinctInsiderCountInCluster,
	getInsiderLastTransactionDate,
	getInsiderPreviousTransaction,
	hasSlackAlertForTransaction,
	recordSlackAlert,
	upsertInsider,
	upsertIssuer,
	upsertTransaction,
} from "../../sql/queries/insiders";

export interface ProcessorStats {
	filingsProcessed: number;
	transactionsCreated: number;
	transactionsUpdated: number;
	urgentAlertsPosted: number;
	errors: Array<{ filing: string; error: string }>;
}

/**
 * Main processor for ingesting Form 4 filings
 * Fetches recent filings, parses them, scores transactions, and posts urgent alerts
 */
export class Form4Processor {
	private db: PgDatabase<any, any, any>;
	private secClient = createSECEdgarClient();
	private parser = createForm4Parser();
	private slackClient = createSlackClient();

	constructor(db: PgDatabase<any, any, any>) {
		this.db = db;
	}

	/**
	 * Run the complete processing pipeline
	 * @param filingCount Number of recent filings to fetch (default 100)
	 * @returns Processing statistics
	 */
	async process(filingCount = 100): Promise<ProcessorStats> {
		const stats: ProcessorStats = {
			filingsProcessed: 0,
			transactionsCreated: 0,
			transactionsUpdated: 0,
			urgentAlertsPosted: 0,
			errors: [],
		};

		console.log(`[Form4Processor] Fetching ${filingCount} recent Form 4 filings...`);

		try {
			// Fetch recent Form 4 filings from SEC
			const filings = await this.secClient.fetchRecentForm4Filings(filingCount);
			console.log(`[Form4Processor] Found ${filings.length} filings to process`);

			// Process each filing
			for (const filing of filings) {
				try {
					await this.processSingleFiling(filing.accessionNumber, filing.cik, filing.filingDate);
					stats.filingsProcessed++;
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : "Unknown error";
					console.error(
						`[Form4Processor] Error processing filing ${filing.accessionNumber}:`,
						errorMessage,
					);
					stats.errors.push({
						filing: filing.accessionNumber,
						error: errorMessage,
					});
				}
			}

			console.log(`[Form4Processor] Processing complete:`, stats);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : "Unknown error";
			console.error("[Form4Processor] Fatal error:", errorMessage);
			stats.errors.push({
				filing: "FETCH_FILINGS",
				error: errorMessage,
			});
		}

		return stats;
	}

	/**
	 * Process a single Form 4 filing
	 */
	private async processSingleFiling(
		accessionNumber: string,
		cik: string,
		filingDate: string,
	): Promise<void> {
		// Fetch Form 4 XML
		const xmlContent = await this.secClient.fetchForm4XML(accessionNumber, cik);

		// Parse Form 4
		const form4Data = this.parser.parse(xmlContent, accessionNumber, filingDate);

		// Upsert issuer
		const issuer = await upsertIssuer(this.db, {
			cik: form4Data.issuer.cik,
			ticker: form4Data.issuer.ticker || null,
			companyName: form4Data.issuer.companyName,
		});

		// Upsert insider
		const insider = await upsertInsider(this.db, {
			issuerId: issuer.id,
			name: form4Data.insider.name,
			title: form4Data.insider.title || null,
		});

		// Filter to only P (buy) and S (sell) transactions
		const relevantTransactions = form4Data.transactions.filter(
			(tx) => tx.transactionCode === TRANSACTION_CODE_BUY || tx.transactionCode === TRANSACTION_CODE_SELL,
		);

		console.log(
			`[Form4Processor] Processing ${relevantTransactions.length} transactions for ${issuer.ticker || issuer.companyName}`,
		);

		// Process each transaction
		for (const txInfo of relevantTransactions) {
			await this.processTransaction(form4Data, txInfo, issuer.id, insider.id);
		}
	}

	/**
	 * Process a single transaction: calculate score, save, and post alert if needed
	 */
	private async processTransaction(
		form4Data: Form4Data,
		txInfo: any,
		issuerId: string,
		insiderId: string,
	): Promise<void> {
		// Calculate signal score with bonuses
		const scoreInput: ScoreInput = {
			transactionCode: txInfo.transactionCode,
			transactionValue: txInfo.transactionValue,
			insiderTitle: form4Data.insider.title,
			isFirstActivityIn180Days: await this.checkFirstActivity(
				insiderId,
				txInfo.transactionDate,
			),
			additionalInsidersInCluster: await this.getClusterBonus(
				issuerId,
				insiderId,
				txInfo.transactionDate,
			),
		};

		const scoreResult = calculateSignalScore(scoreInput);

		// Upsert transaction
		const transaction = await upsertTransaction(this.db, {
			filingAccession: form4Data.accessionNumber,
			insiderId,
			issuerId,
			transactionDate: txInfo.transactionDate,
			transactionCode: txInfo.transactionCode,
			shares: txInfo.shares.toString(),
			price: txInfo.pricePerShare.toString(),
			transactionValue: txInfo.transactionValue.toString(),
			postTransactionShares: txInfo.postTransactionShares.toString(),
			isDirectOwnership: txInfo.isDirectOwnership,
			is10b51: txInfo.is10b51,
			signalScore: scoreResult.score.toString(),
		});

		console.log(
			`[Form4Processor] Transaction saved: ${form4Data.issuer.ticker || form4Data.issuer.companyName} - ${form4Data.insider.name} - Score: ${scoreResult.score}`,
		);

		// Check if we should post an urgent alert
		if (shouldTriggerUrgentAlert(scoreResult.score, txInfo.transactionValue)) {
			await this.postUrgentAlert(transaction, form4Data, insiderId);
		}
	}

	/**
	 * Check if this is the insider's first transaction in 180+ days
	 */
	private async checkFirstActivity(insiderId: string, transactionDate: string): Promise<boolean> {
		// Calculate cutoff date (180 days before transaction)
		const txDate = new Date(transactionDate);
		const cutoffDate = new Date(txDate);
		cutoffDate.setDate(cutoffDate.getDate() - FIRST_ACTIVITY_DAYS);
		const cutoffDateStr = cutoffDate.toISOString().split("T")[0];

		// Get last transaction before this one
		const lastTxDate = await getInsiderLastTransactionDate(
			this.db,
			insiderId,
			transactionDate,
		);

		// If no previous transaction or it was before the cutoff, this is first activity
		return !lastTxDate || lastTxDate < cutoffDateStr;
	}

	/**
	 * Get cluster bonus: count of additional insiders trading same ticker within 7 days
	 */
	private async getClusterBonus(
		issuerId: string,
		insiderId: string,
		transactionDate: string,
	): Promise<number> {
		// Calculate date range (7 days centered on transaction date)
		const txDate = new Date(transactionDate);
		const startDate = new Date(txDate);
		startDate.setDate(startDate.getDate() - CLUSTER_DETECTION_DAYS);
		const endDate = new Date(txDate);
		endDate.setDate(endDate.getDate() + CLUSTER_DETECTION_DAYS);

		const startDateStr = startDate.toISOString().split("T")[0];
		const endDateStr = endDate.toISOString().split("T")[0];

		// Get count of distinct insiders (excluding current insider)
		const count = await getDistinctInsiderCountInCluster(
			this.db,
			issuerId,
			startDateStr,
			endDateStr,
			insiderId,
		);

		// Cluster bonus is the number of additional insiders (not including current one)
		return Math.max(0, count);
	}

	/**
	 * Post an urgent alert to Slack
	 */
	private async postUrgentAlert(
		transaction: any,
		form4Data: Form4Data,
		insiderId: string,
	): Promise<void> {
		// Check if we've already alerted on this transaction
		const alreadyAlerted = await hasSlackAlertForTransaction(this.db, transaction.id, "urgent");
		if (alreadyAlerted) {
			console.log(
				`[Form4Processor] Skipping alert for transaction ${transaction.id} - already alerted`,
			);
			return;
		}

		// Calculate holdings delta
		const previousTx = await getInsiderPreviousTransaction(
			this.db,
			insiderId,
			transaction.transactionDate,
		);
		const holdingsDelta = previousTx
			? calculateHoldingsDelta(
					Number(previousTx.postTransactionShares),
					Number(transaction.postTransactionShares),
				)
			: undefined;

		// Format and post message
		const message = formatUrgentAlert(
			transaction,
			{
				id: form4Data.issuer.cik,
				cik: form4Data.issuer.cik,
				ticker: form4Data.issuer.ticker || null,
				companyName: form4Data.issuer.companyName,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			{
				id: insiderId,
				issuerId: transaction.issuerId,
				name: form4Data.insider.name,
				title: form4Data.insider.title || null,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			holdingsDelta,
		);

		const response = await this.slackClient.postMessage(message);

		if (response.ok) {
			// Record alert in database
			await recordSlackAlert(this.db, {
				transactionId: transaction.id,
				issuerId: transaction.issuerId,
				alertType: "urgent",
				slackMessageTs: response.ts,
				slackThreadTs: response.ts, // Start a new thread
				postedAt: new Date(),
			});

			console.log(
				`[Form4Processor] Posted urgent alert for ${form4Data.issuer.ticker || form4Data.issuer.companyName}`,
			);
		} else {
			console.error(`[Form4Processor] Failed to post Slack alert: ${response.error}`);
		}
	}
}

/**
 * Create a Form 4 processor instance
 */
export function createForm4Processor(db: PgDatabase<any, any, any>): Form4Processor {
	return new Form4Processor(db);
}
