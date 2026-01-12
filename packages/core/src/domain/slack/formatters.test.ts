import { describe, expect, it } from "vitest";
import type { Insider, Issuer, Transaction } from "../../sql/schema";
import { formatUrgentAlert, formatDailyDigest } from "./formatters";

describe("Slack Formatters", () => {
	describe("formatUrgentAlert", () => {
		const mockTransaction: Transaction = {
			id: "tx-123",
			filingAccession: "0001234567-24-000001",
			insiderId: "insider-1",
			issuerId: "issuer-1",
			transactionDate: "2024-01-15",
			transactionCode: "P",
			shares: "10000",
			price: "150.50",
			transactionValue: "1505000",
			postTransactionShares: "500000",
			isDirectOwnership: true,
			is10b51: false,
			signalScore: "5.5",
			createdAt: new Date("2024-01-16"),
			updatedAt: new Date("2024-01-16"),
		};

		const mockIssuer: Issuer = {
			id: "issuer-1",
			cik: "0000320193",
			ticker: "AAPL",
			companyName: "Apple Inc.",
			createdAt: new Date("2024-01-01"),
			updatedAt: new Date("2024-01-01"),
		};

		const mockInsider: Insider = {
			id: "insider-1",
			issuerId: "issuer-1",
			name: "Tim Cook",
			title: "Chief Executive Officer",
			createdAt: new Date("2024-01-01"),
			updatedAt: new Date("2024-01-01"),
		};

		it("should format a buy transaction alert", () => {
			const message = formatUrgentAlert(mockTransaction, mockIssuer, mockInsider);

			expect(message.text).toContain("AAPL");
			expect(message.text).toContain("Tim Cook");
			expect(message.text).toContain("BOUGHT");
			expect(message.blocks).toBeDefined();
			expect(message.blocks?.length).toBeGreaterThan(0);

			// Check header block
			const headerBlock = message.blocks?.[0];
			expect(headerBlock?.type).toBe("header");
			expect(headerBlock?.text?.text).toContain("AAPL");
			expect(headerBlock?.text?.text).toContain("Buy");
		});

		it("should format a sell transaction alert", () => {
			const sellTransaction = { ...mockTransaction, transactionCode: "S", signalScore: "-3.5" };
			const message = formatUrgentAlert(sellTransaction, mockIssuer, mockInsider);

			expect(message.text).toContain("SOLD");
			expect(message.blocks?.[0]?.text?.text).toContain("Sell");
		});

		it("should include holdings delta when provided", () => {
			const message = formatUrgentAlert(mockTransaction, mockIssuer, mockInsider, 25.5);

			// Should have a context block with holdings delta
			const contextBlocks = message.blocks?.filter((b) => b.type === "context");
			expect(contextBlocks?.length).toBeGreaterThan(0);

			const deltaText = JSON.stringify(message.blocks);
			expect(deltaText).toContain("Holdings changed");
			expect(deltaText).toContain("25.5%");
		});

		it("should indicate 10b5-1 plan when applicable", () => {
			const tenB51Transaction = { ...mockTransaction, is10b51: true };
			const message = formatUrgentAlert(tenB51Transaction, mockIssuer, mockInsider);

			const messageText = JSON.stringify(message.blocks);
			expect(messageText).toContain("10b5-1");
		});

		it("should include SEC filing link", () => {
			const message = formatUrgentAlert(mockTransaction, mockIssuer, mockInsider);

			const messageText = JSON.stringify(message.blocks);
			expect(messageText).toContain("sec.gov");
			expect(messageText).toContain("View SEC Filing");
		});

		it("should handle missing ticker gracefully", () => {
			const issuerNoTicker = { ...mockIssuer, ticker: null };
			const message = formatUrgentAlert(mockTransaction, issuerNoTicker, mockInsider);

			expect(message.text).toContain("Apple Inc.");
			expect(message.blocks?.length).toBeGreaterThan(0);
		});

		it("should handle missing insider title", () => {
			const insiderNoTitle = { ...mockInsider, title: null };
			const message = formatUrgentAlert(mockTransaction, mockIssuer, insiderNoTitle);

			expect(message.text).toContain("Tim Cook");
			expect(message.blocks?.length).toBeGreaterThan(0);
		});
	});

	describe("formatDailyDigest", () => {
		const mockTransactionsMap = new Map([
			[
				"AAPL",
				[
					{
						id: "tx-1",
						filingAccession: "0001234567-24-000001",
						insiderId: "insider-1",
						issuerId: "issuer-1",
						transactionDate: "2024-01-15",
						transactionCode: "P",
						shares: "10000",
						price: "150.50",
						transactionValue: "1505000",
						postTransactionShares: "500000",
						isDirectOwnership: true,
						is10b51: false,
						signalScore: "5.5",
						createdAt: new Date("2024-01-16"),
						updatedAt: new Date("2024-01-16"),
						issuer: {
							id: "issuer-1",
							cik: "0000320193",
							ticker: "AAPL",
							companyName: "Apple Inc.",
							createdAt: new Date("2024-01-01"),
							updatedAt: new Date("2024-01-01"),
						},
						insider: {
							id: "insider-1",
							issuerId: "issuer-1",
							name: "Tim Cook",
							title: "CEO",
							createdAt: new Date("2024-01-01"),
							updatedAt: new Date("2024-01-01"),
						},
					},
					{
						id: "tx-2",
						filingAccession: "0001234567-24-000002",
						insiderId: "insider-2",
						issuerId: "issuer-1",
						transactionDate: "2024-01-15",
						transactionCode: "S",
						shares: "5000",
						price: "150.00",
						transactionValue: "750000",
						postTransactionShares: "100000",
						isDirectOwnership: true,
						is10b51: false,
						signalScore: "-2.0",
						createdAt: new Date("2024-01-16"),
						updatedAt: new Date("2024-01-16"),
						issuer: {
							id: "issuer-1",
							cik: "0000320193",
							ticker: "AAPL",
							companyName: "Apple Inc.",
							createdAt: new Date("2024-01-01"),
							updatedAt: new Date("2024-01-01"),
						},
						insider: {
							id: "insider-2",
							issuerId: "issuer-1",
							name: "Luca Maestri",
							title: "CFO",
							createdAt: new Date("2024-01-01"),
							updatedAt: new Date("2024-01-01"),
						},
					},
				],
			],
		]);

		it("should format daily digest with transaction summary", () => {
			const message = formatDailyDigest("2024-01-15", mockTransactionsMap);

			expect(message.text).toContain("Daily Insider Trading Digest");
			expect(message.text).toContain("2024-01-15");
			expect(message.text).toContain("2 transactions");
			expect(message.text).toContain("1 tickers");

			expect(message.blocks).toBeDefined();
			expect(message.blocks?.length).toBeGreaterThan(0);
		});

		it("should include header block", () => {
			const message = formatDailyDigest("2024-01-15", mockTransactionsMap);

			const headerBlock = message.blocks?.[0];
			expect(headerBlock?.type).toBe("header");
			expect(headerBlock?.text?.text).toContain("Daily Insider Trading Digest");
			expect(headerBlock?.text?.text).toContain("2024-01-15");
		});

		it("should group transactions by ticker", () => {
			const message = formatDailyDigest("2024-01-15", mockTransactionsMap);

			const messageText = JSON.stringify(message.blocks);
			expect(messageText).toContain("AAPL");
			expect(messageText).toContain("1 buys");
			expect(messageText).toContain("1 sells");
		});

		it("should list top insiders", () => {
			const message = formatDailyDigest("2024-01-15", mockTransactionsMap);

			const messageText = JSON.stringify(message.blocks);
			expect(messageText).toContain("Tim Cook");
			expect(messageText).toContain("Luca Maestri");
		});

		it("should handle empty transaction map", () => {
			const emptyMap = new Map();
			const message = formatDailyDigest("2024-01-15", emptyMap);

			expect(message.text).toContain("0 transactions");
			expect(message.text).toContain("0 tickers");
		});

		it("should limit insiders to top 3 per ticker", () => {
			// Create a map with 5 transactions for same ticker
			const manyTransactions = Array.from({ length: 5 }, (_, i) => ({
				id: `tx-${i}`,
				filingAccession: `000${i}-24-000001`,
				insiderId: `insider-${i}`,
				issuerId: "issuer-1",
				transactionDate: "2024-01-15",
				transactionCode: "P",
				shares: "1000",
				price: "100.00",
				transactionValue: "100000",
				postTransactionShares: "10000",
				isDirectOwnership: true,
				is10b51: false,
				signalScore: String(i + 1),
				createdAt: new Date("2024-01-16"),
				updatedAt: new Date("2024-01-16"),
				issuer: {
					id: "issuer-1",
					cik: "0000320193",
					ticker: "AAPL",
					companyName: "Apple Inc.",
					createdAt: new Date("2024-01-01"),
					updatedAt: new Date("2024-01-01"),
				},
				insider: {
					id: `insider-${i}`,
					issuerId: "issuer-1",
					name: `Insider ${i}`,
					title: "Executive",
					createdAt: new Date("2024-01-01"),
					updatedAt: new Date("2024-01-01"),
				},
			}));

			const manyMap = new Map([["AAPL", manyTransactions]]);
			const message = formatDailyDigest("2024-01-15", manyMap);

			const messageText = JSON.stringify(message.blocks);
			expect(messageText).toContain("...and 2 more transactions");
		});
	});
});
