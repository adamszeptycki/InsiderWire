import { z } from "zod";

/**
 * Input schema for listing transactions with filters
 */
export const ListTransactionsInputSchema = z.object({
	ticker: z.string().optional(),
	startDate: z.string().optional(), // ISO date string
	endDate: z.string().optional(), // ISO date string
	minScore: z.number().optional(),
	limit: z.number().min(1).max(100).default(50),
	offset: z.number().min(0).default(0),
});

export type ListTransactionsInput = z.infer<typeof ListTransactionsInputSchema>;

/**
 * Input schema for getting transaction details
 */
export const GetTransactionInputSchema = z.object({
	id: z.string().uuid(),
});

export type GetTransactionInput = z.infer<typeof GetTransactionInputSchema>;

/**
 * Input schema for getting ticker stats
 */
export const GetTickerStatsInputSchema = z.object({
	ticker: z.string(),
	daysBack: z.number().min(1).max(365).default(90),
});

export type GetTickerStatsInput = z.infer<typeof GetTickerStatsInputSchema>;

/**
 * Input schema for searching tickers
 */
export const SearchTickersInputSchema = z.object({
	query: z.string().min(1),
	limit: z.number().min(1).max(20).default(10),
});

export type SearchTickersInput = z.infer<typeof SearchTickersInputSchema>;
