import type { Form4Data, InsiderInfo, IssuerInfo, TransactionInfo } from "./types";
import { TRANSACTION_CODE_BUY, TRANSACTION_CODE_SELL } from "./types";

/**
 * Simple XML parser for Form 4 documents
 * Avoids external dependencies by using regex-based parsing
 */
export class Form4Parser {
	/**
	 * Parse Form 4 XML document into structured data
	 * @param xmlText Form 4 XML string
	 * @param accessionNumber Filing accession number
	 * @param filingDate Filing date (ISO string)
	 * @returns Parsed Form 4 data
	 */
	parse(xmlText: string, accessionNumber: string, filingDate: string): Form4Data {
		// Extract issuer information
		const issuer = this.parseIssuer(xmlText);

		// Extract reporting owner (insider) information
		const insider = this.parseInsider(xmlText);

		// Extract transactions (both derivative and non-derivative)
		const transactions = this.parseTransactions(xmlText);

		return {
			accessionNumber,
			filingDate,
			issuer,
			insider,
			transactions,
		};
	}

	/**
	 * Parse issuer information from Form 4 XML
	 */
	private parseIssuer(xml: string): IssuerInfo {
		const cik = this.extractText(xml, "issuerCik") || "";
		const companyName = this.extractText(xml, "issuerName") || "";
		const ticker = this.extractText(xml, "issuerTradingSymbol");

		return {
			cik: cik.replace(/^0+/, ""), // Remove leading zeros
			companyName,
			ticker: ticker || undefined,
		};
	}

	/**
	 * Parse reporting owner (insider) information from Form 4 XML
	 */
	private parseInsider(xml: string): InsiderInfo {
		const name = this.extractText(xml, "rptOwnerName") || "";
		const title = this.extractText(xml, "officerTitle");

		// Parse relationship flags
		const isDirector = this.extractText(xml, "isDirector") === "1";
		const isOfficer = this.extractText(xml, "isOfficer") === "1";
		const isTenPercentOwner = this.extractText(xml, "isTenPercentOwner") === "1";
		const isOther = this.extractText(xml, "isOther") === "1";

		return {
			name,
			title: title || undefined,
			isDirector,
			isOfficer,
			isTenPercentOwner,
			isOther,
		};
	}

	/**
	 * Parse transactions from Form 4 XML (both derivative and non-derivative)
	 */
	private parseTransactions(xml: string): TransactionInfo[] {
		const transactions: TransactionInfo[] = [];

		// Parse non-derivative transactions
		const nonDerivTransactions = this.extractNonDerivativeTransactions(xml);
		transactions.push(...nonDerivTransactions);

		// Parse derivative transactions
		const derivTransactions = this.extractDerivativeTransactions(xml);
		transactions.push(...derivTransactions);

		return transactions;
	}

	/**
	 * Extract non-derivative transactions
	 */
	private extractNonDerivativeTransactions(xml: string): TransactionInfo[] {
		const transactions: TransactionInfo[] = [];
		const tableMatch = xml.match(
			/<nonDerivativeTable>([\s\S]*?)<\/nonDerivativeTable>/i,
		);

		if (!tableMatch) return transactions;

		const tableXml = tableMatch[1];
		const txRegex = /<nonDerivativeTransaction>([\s\S]*?)<\/nonDerivativeTransaction>/gi;
		const txMatches = tableXml.matchAll(txRegex);

		for (const match of txMatches) {
			const txXml = match[1];
			const transaction = this.parseTransactionElement(txXml);
			if (transaction) {
				transactions.push(transaction);
			}
		}

		return transactions;
	}

	/**
	 * Extract derivative transactions
	 */
	private extractDerivativeTransactions(xml: string): TransactionInfo[] {
		const transactions: TransactionInfo[] = [];
		const tableMatch = xml.match(/<derivativeTable>([\s\S]*?)<\/derivativeTable>/i);

		if (!tableMatch) return transactions;

		const tableXml = tableMatch[1];
		const txRegex = /<derivativeTransaction>([\s\S]*?)<\/derivativeTransaction>/gi;
		const txMatches = tableXml.matchAll(txRegex);

		for (const match of txMatches) {
			const txXml = match[1];
			const transaction = this.parseTransactionElement(txXml);
			if (transaction) {
				transactions.push(transaction);
			}
		}

		return transactions;
	}

	/**
	 * Parse a single transaction element
	 */
	private parseTransactionElement(txXml: string): TransactionInfo | null {
		// Extract transaction code
		const transactionCode = this.extractText(txXml, "transactionCode");

		// Filter to only P (purchase) and S (sale) transactions
		if (
			!transactionCode ||
			(transactionCode !== TRANSACTION_CODE_BUY && transactionCode !== TRANSACTION_CODE_SELL)
		) {
			return null;
		}

		// Extract transaction date
		const transactionDate = this.extractText(txXml, "transactionDate");
		if (!transactionDate) return null;

		// Extract shares and price
		const sharesStr = this.extractText(txXml, "transactionShares");
		const priceStr = this.extractText(txXml, "transactionPricePerShare");

		if (!sharesStr || !priceStr) return null;

		const shares = Number.parseFloat(sharesStr);
		const price = Number.parseFloat(priceStr);

		if (Number.isNaN(shares) || Number.isNaN(price)) return null;

		// Extract post-transaction shares
		const postSharesStr = this.extractText(txXml, "sharesOwnedFollowingTransaction");
		const postShares = postSharesStr ? Number.parseFloat(postSharesStr) : 0;

		// Determine if direct ownership
		const ownershipCode = this.extractText(txXml, "directOrIndirectOwnership");
		const isDirectOwnership = ownershipCode === "D";

		// Check for 10b5-1 plan in footnotes
		const footnoteId = this.extractAttribute(txXml, "footnoteId");
		const is10b51 = this.check10b51InFootnotes(txXml, footnoteId);

		return {
			transactionDate,
			transactionCode,
			shares,
			pricePerShare: price,
			transactionValue: shares * price,
			postTransactionShares: postShares,
			isDirectOwnership,
			is10b51,
		};
	}

	/**
	 * Check if transaction is under a 10b5-1 plan by looking at footnotes
	 */
	private check10b51InFootnotes(xml: string, footnoteId: string | null): boolean {
		if (!footnoteId) return false;

		// Look for footnote content
		const footnoteRegex = new RegExp(
			`<footnote[^>]*id=["']${footnoteId}["'][^>]*>([\\s\\S]*?)<\\/footnote>`,
			"i",
		);
		const match = xml.match(footnoteRegex);

		if (!match) return false;

		const footnoteText = match[1].toLowerCase();
		return footnoteText.includes("10b5-1") || footnoteText.includes("10b5");
	}

	/**
	 * Extract text content from an XML tag
	 */
	private extractText(xml: string, tagName: string): string | null {
		// Try <tagName><value>text</value></tagName> format first (common in Form 4)
		const valueRegex = new RegExp(
			`<${tagName}[^>]*>\\s*<value>([\\s\\S]*?)<\\/value>\\s*<\/${tagName}>`,
			"i",
		);
		let match = xml.match(valueRegex);

		if (match) return match[1].trim();

		// Try direct <tagName>text</tagName> format
		const directRegex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\/${tagName}>`, "i");
		match = xml.match(directRegex);

		return match ? match[1].trim() : null;
	}

	/**
	 * Extract attribute value from an XML tag
	 */
	private extractAttribute(xml: string, attrName: string): string | null {
		const regex = new RegExp(`${attrName}=["']([^"']+)["']`, "i");
		const match = xml.match(regex);
		return match ? match[1] : null;
	}
}

/**
 * Create a Form 4 parser instance
 */
export function createForm4Parser(): Form4Parser {
	return new Form4Parser();
}
