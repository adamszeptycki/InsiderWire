import type { Insider, Issuer, Transaction } from "../../sql/schema";
import { formatSignalScore, getScoreEmoji } from "../scoring/rules";
import type { SlackMessage } from "./client";

/**
 * Format a transaction as an urgent alert message
 */
export function formatUrgentAlert(
	transaction: Transaction,
	issuer: Issuer,
	insider: Insider,
	holdingsDeltaPercent?: number,
): SlackMessage {
	const scoreEmoji = getScoreEmoji(Number(transaction.signalScore));
	const formattedScore = formatSignalScore(Number(transaction.signalScore));
	const actionVerb = transaction.transactionCode === "P" ? "BOUGHT" : "SOLD";
	const tickerDisplay = issuer.ticker || issuer.companyName;

	// Format values
	const sharesFormatted = Number(transaction.shares).toLocaleString();
	const priceFormatted = `$${Number(transaction.price).toFixed(2)}`;
	const valueFormatted = `$${Number(transaction.transactionValue).toLocaleString(undefined, {
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	})}`;

	// Build SEC filing URL
	const accessionNoDashes = transaction.filingAccession.replace(/-/g, "");
	const cikPadded = issuer.cik.padStart(10, "0");
	const filingUrl = `https://www.sec.gov/cgi-bin/viewer?action=view&cik=${cikPadded}&accession_number=${transaction.filingAccession}&xbrl_type=v`;

	// Fallback text for notifications
	const fallbackText = `${scoreEmoji} ${tickerDisplay}: ${insider.name} ${actionVerb} ${sharesFormatted} shares (Signal Score: ${formattedScore})`;

	// Build Slack Block Kit message
	const blocks: Array<Record<string, any>> = [
		{
			type: "header",
			text: {
				type: "plain_text",
				text: `${scoreEmoji} ${tickerDisplay} - Insider ${actionVerb === "BOUGHT" ? "Buy" : "Sell"}`,
				emoji: true,
			},
		},
		{
			type: "section",
			fields: [
				{
					type: "mrkdwn",
					text: `*Insider:*\n${insider.name}${insider.title ? ` (${insider.title})` : ""}`,
				},
				{
					type: "mrkdwn",
					text: `*Signal Score:*\n${formattedScore}`,
				},
				{
					type: "mrkdwn",
					text: `*Shares:*\n${sharesFormatted} @ ${priceFormatted}`,
				},
				{
					type: "mrkdwn",
					text: `*Total Value:*\n${valueFormatted}`,
				},
				{
					type: "mrkdwn",
					text: `*Transaction Date:*\n${transaction.transactionDate}`,
				},
				{
					type: "mrkdwn",
					text: `*Ownership:*\n${transaction.isDirectOwnership ? "Direct" : "Indirect"}`,
				},
			],
		},
	];

	// Add holdings delta if available
	if (holdingsDeltaPercent !== undefined && holdingsDeltaPercent !== 0) {
		const deltaSign = holdingsDeltaPercent > 0 ? "+" : "";
		const deltaEmoji = holdingsDeltaPercent > 0 ? "📈" : "📉";
		blocks.push({
			type: "context",
			elements: [
				{
					type: "mrkdwn",
					text: `${deltaEmoji} Holdings changed by *${deltaSign}${holdingsDeltaPercent.toFixed(1)}%* to ${Number(transaction.postTransactionShares).toLocaleString()} shares`,
				},
			],
		});
	}

	// Add 10b5-1 plan indicator if applicable
	if (transaction.is10b51) {
		blocks.push({
			type: "context",
			elements: [
				{
					type: "mrkdwn",
					text: "ℹ️ This transaction was made pursuant to a Rule 10b5-1 trading plan",
				},
			],
		});
	}

	// Add SEC filing link
	blocks.push({
		type: "actions",
		elements: [
			{
				type: "button",
				text: {
					type: "plain_text",
					text: "View SEC Filing",
					emoji: true,
				},
				url: filingUrl,
				action_id: "view_filing",
			},
		],
	});

	return {
		text: fallbackText,
		blocks,
	};
}

/**
 * Format daily digest message with transaction summaries
 */
export function formatDailyDigest(
	date: string,
	transactionsByTicker: Map<
		string,
		Array<Transaction & { issuer: Issuer; insider: Insider }>
	>,
): SlackMessage {
	const totalTransactions = Array.from(transactionsByTicker.values()).reduce(
		(sum, txs) => sum + txs.length,
		0,
	);

	// Fallback text
	const fallbackText = `Daily Insider Trading Digest for ${date} - ${totalTransactions} transactions across ${transactionsByTicker.size} tickers`;

	// Build blocks
	const blocks: Array<Record<string, any>> = [
		{
			type: "header",
			text: {
				type: "plain_text",
				text: `📊 Daily Insider Trading Digest - ${date}`,
				emoji: true,
			},
		},
		{
			type: "section",
			text: {
				type: "mrkdwn",
				text: `*${totalTransactions}* transactions across *${transactionsByTicker.size}* tickers`,
			},
		},
		{
			type: "divider",
		},
	];

	// Sort tickers by highest absolute signal score
	const sortedTickers = Array.from(transactionsByTicker.entries()).sort((a, b) => {
		const maxScoreA = Math.max(...a[1].map((tx) => Math.abs(Number(tx.signalScore))));
		const maxScoreB = Math.max(...b[1].map((tx) => Math.abs(Number(tx.signalScore))));
		return maxScoreB - maxScoreA;
	});

	// Add ticker sections
	for (const [ticker, txs] of sortedTickers) {
		const buyCount = txs.filter((tx) => tx.transactionCode === "P").length;
		const sellCount = txs.filter((tx) => tx.transactionCode === "S").length;
		const totalValue = txs.reduce((sum, tx) => sum + Number(tx.transactionValue), 0);

		// Ticker header
		blocks.push({
			type: "section",
			text: {
				type: "mrkdwn",
				text: `*${ticker || txs[0].issuer.companyName}*\n${buyCount} buys, ${sellCount} sells | Total: $${totalValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
			},
		});

		// List top insiders (max 3 per ticker to keep digest concise)
		const topInsiders = txs
			.sort((a, b) => Math.abs(Number(b.signalScore)) - Math.abs(Number(a.signalScore)))
			.slice(0, 3);

		const insiderLines = topInsiders.map((tx) => {
			const scoreEmoji = getScoreEmoji(Number(tx.signalScore));
			const action = tx.transactionCode === "P" ? "bought" : "sold";
			const value = `$${Number(tx.transactionValue).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
			const score = formatSignalScore(Number(tx.signalScore));
			return `${scoreEmoji} ${tx.insider.name} ${action} ${value} worth (score: ${score})`;
		});

		blocks.push({
			type: "context",
			elements: [
				{
					type: "mrkdwn",
					text: insiderLines.join("\n"),
				},
			],
		});

		if (txs.length > 3) {
			blocks.push({
				type: "context",
				elements: [
					{
						type: "mrkdwn",
						text: `_...and ${txs.length - 3} more transactions_`,
					},
				],
			});
		}

		blocks.push({
			type: "divider",
		});
	}

	return {
		text: fallbackText,
		blocks,
	};
}

/**
 * Format a simple text message for testing
 */
export function formatTestMessage(message: string): SlackMessage {
	return {
		text: message,
		blocks: [
			{
				type: "section",
				text: {
					type: "mrkdwn",
					text: message,
				},
			},
		],
	};
}
