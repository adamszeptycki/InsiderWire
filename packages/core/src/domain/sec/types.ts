import { z } from "zod";

// SEC Form 4 transaction codes we care about
export const TRANSACTION_CODE_BUY = "P"; // Purchase
export const TRANSACTION_CODE_SELL = "S"; // Sale

// SEC filing entry from RSS/search results
export const SECFilingEntrySchema = z.object({
	accessionNumber: z.string(), // e.g., "0001209191-24-000123"
	filingDate: z.string(), // ISO date string
	cik: z.string(), // Central Index Key
	companyName: z.string(),
	formType: z.string(), // Should be "4" for Form 4
	filingUrl: z.string(), // URL to the filing page
});

export type SECFilingEntry = z.infer<typeof SECFilingEntrySchema>;

// Parsed issuer information from Form 4 XML
export const IssuerInfoSchema = z.object({
	cik: z.string(),
	ticker: z.string().optional(),
	companyName: z.string(),
});

export type IssuerInfo = z.infer<typeof IssuerInfoSchema>;

// Parsed insider (reporting owner) information from Form 4 XML
export const InsiderInfoSchema = z.object({
	name: z.string(),
	title: z.string().optional(),
	isDirector: z.boolean().default(false),
	isOfficer: z.boolean().default(false),
	isTenPercentOwner: z.boolean().default(false),
	isOther: z.boolean().default(false),
});

export type InsiderInfo = z.infer<typeof InsiderInfoSchema>;

// Parsed transaction from Form 4 XML
export const TransactionInfoSchema = z.object({
	transactionDate: z.string(), // ISO date string
	transactionCode: z.string(), // e.g., "P" or "S"
	shares: z.number(),
	pricePerShare: z.number(),
	transactionValue: z.number(),
	postTransactionShares: z.number(),
	isDirectOwnership: z.boolean(),
	is10b51: z.boolean(), // Parsed from footnotes
	footnotes: z.string().optional(),
});

export type TransactionInfo = z.infer<typeof TransactionInfoSchema>;

// Complete parsed Form 4 document
export const Form4DataSchema = z.object({
	accessionNumber: z.string(),
	filingDate: z.string(),
	issuer: IssuerInfoSchema,
	insider: InsiderInfoSchema,
	transactions: z.array(TransactionInfoSchema),
});

export type Form4Data = z.infer<typeof Form4DataSchema>;

// Title-based role detection for scoring multipliers
export const EXECUTIVE_TITLES = [
	"CEO",
	"Chief Executive Officer",
	"CFO",
	"Chief Financial Officer",
	"Chairman",
	"Chairwoman",
	"Chair",
	"President",
	"COO",
	"Chief Operating Officer",
];

export function isExecutiveRole(title: string | undefined): boolean {
	if (!title) return false;
	const normalizedTitle = title.toUpperCase();
	return EXECUTIVE_TITLES.some((execTitle) => normalizedTitle.includes(execTitle.toUpperCase()));
}
