import { protectedProcedure, router } from "@starter/core-web/src/trpc/trpc";
import {
	getRecentHighlights,
	getTickerStats,
	getTransaction,
	listTransactions,
	searchForTickers,
} from "./functions";
import {
	GetTickerStatsInputSchema,
	GetTransactionInputSchema,
	ListTransactionsInputSchema,
	SearchTickersInputSchema,
} from "./schema";

export const insidersRouter = router({
	/**
	 * List transactions with optional filters (ticker, date range, min score)
	 * Protected: requires authentication
	 */
	list: protectedProcedure.input(ListTransactionsInputSchema).query(async ({ ctx, input }) => {
		return listTransactions({ ctx, input });
	}),

	/**
	 * Get detailed information about a specific transaction
	 * Protected: requires authentication
	 */
	get: protectedProcedure.input(GetTransactionInputSchema).query(async ({ ctx, input }) => {
		return getTransaction({ ctx, input });
	}),

	/**
	 * Get statistics and recent activity for a specific ticker
	 * Protected: requires authentication
	 */
	tickerStats: protectedProcedure.input(GetTickerStatsInputSchema).query(async ({ ctx, input }) => {
		return getTickerStats({ ctx, input });
	}),

	/**
	 * Get recent high-score transactions for dashboard homepage
	 * Protected: requires authentication
	 */
	highlights: protectedProcedure.query(async ({ ctx }) => {
		return getRecentHighlights({ ctx });
	}),

	/**
	 * Search for tickers by symbol or company name
	 * Protected: requires authentication
	 */
	search: protectedProcedure.input(SearchTickersInputSchema).query(async ({ ctx, input }) => {
		return searchForTickers({ ctx, input });
	}),
});
