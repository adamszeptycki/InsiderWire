import type { Form4Data, SECFilingEntry } from "./types";

const SEC_BASE_URL = "https://www.sec.gov";
const SEC_EDGAR_RSS_URL = `${SEC_BASE_URL}/cgi-bin/browse-edgar`;

// Rate limiter: SEC allows 10 requests per second
class RateLimiter {
	private queue: Array<() => void> = [];
	private processing = false;
	private readonly minDelay = 100; // 100ms = 10 requests/second

	async execute<T>(fn: () => Promise<T>): Promise<T> {
		return new Promise((resolve, reject) => {
			this.queue.push(async () => {
				try {
					const result = await fn();
					resolve(result);
				} catch (error) {
					reject(error);
				}
			});
			this.process();
		});
	}

	private async process() {
		if (this.processing || this.queue.length === 0) return;

		this.processing = true;
		while (this.queue.length > 0) {
			const task = this.queue.shift();
			if (task) {
				await task();
				await this.delay(this.minDelay);
			}
		}
		this.processing = false;
	}

	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}

export class SECEdgarClient {
	private rateLimiter = new RateLimiter();
	private userAgent: string;

	constructor(userAgent?: string) {
		// SEC requires a user agent with company name and contact email
		this.userAgent =
			userAgent || process.env.SEC_EDGAR_USER_AGENT || "InsiderWire support@example.com";
	}

	/**
	 * Fetch recent Form 4 filings from SEC EDGAR
	 * @param count Maximum number of filings to retrieve (default 100)
	 * @returns Array of filing entries with metadata
	 */
	async fetchRecentForm4Filings(count = 100): Promise<SECFilingEntry[]> {
		const url = new URL(SEC_EDGAR_RSS_URL);
		url.searchParams.set("action", "getcurrent");
		url.searchParams.set("type", "4"); // Form 4 only
		url.searchParams.set("owner", "include"); // Include insider ownership
		url.searchParams.set("start", "0");
		url.searchParams.set("count", count.toString());
		url.searchParams.set("output", "atom"); // RSS/Atom feed format

		return this.rateLimiter.execute(async () => {
			const response = await fetch(url.toString(), {
				headers: {
					"User-Agent": this.userAgent,
					Accept: "application/atom+xml, application/xml, text/xml",
				},
			});

			if (!response.ok) {
				throw new Error(`SEC EDGAR API error: ${response.status} ${response.statusText}`);
			}

			const xmlText = await response.text();
			return this.parseAtomFeed(xmlText);
		});
	}

	/**
	 * Fetch a specific Form 4 XML document by accession number
	 * @param accessionNumber SEC accession number (e.g., "0001209191-24-000123")
	 * @param cik Company CIK number
	 * @returns Form 4 XML as string
	 */
	async fetchForm4XML(accessionNumber: string, cik: string): Promise<string> {
		// Format: https://www.sec.gov/Archives/edgar/data/{CIK}/{ACCESSION-NO-DASHES}/{ACCESSION-NO}.xml
		const accessionNoDashes = accessionNumber.replace(/-/g, "");
		const cikPadded = cik.padStart(10, "0");
		const url = `${SEC_BASE_URL}/Archives/edgar/data/${cikPadded}/${accessionNoDashes}/${accessionNumber}.xml`;

		return this.rateLimiter.execute(async () => {
			const response = await fetch(url, {
				headers: {
					"User-Agent": this.userAgent,
					Accept: "application/xml, text/xml",
				},
			});

			if (!response.ok) {
				throw new Error(
					`Failed to fetch Form 4 XML: ${response.status} ${response.statusText}`,
				);
			}

			return response.text();
		});
	}

	/**
	 * Parse Atom/RSS feed XML to extract filing entries
	 * @param xmlText Atom feed XML string
	 * @returns Array of filing entries
	 */
	private parseAtomFeed(xmlText: string): SECFilingEntry[] {
		// Simple XML parsing without external dependencies
		// Extract <entry> elements from Atom feed
		const entries: SECFilingEntry[] = [];
		const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
		const matches = xmlText.matchAll(entryRegex);

		for (const match of matches) {
			const entryXml = match[1];

			// Extract fields using regex (basic approach)
			const title = this.extractXmlTag(entryXml, "title") || "";
			const updated = this.extractXmlTag(entryXml, "updated") || "";
			const link = this.extractXmlAttribute(entryXml, "link", "href") || "";

			// Title format: "4 - {CompanyName} ({CIK})"
			const titleMatch = title.match(/^4\s*-\s*(.+?)\s*\((\d+)\)$/);
			if (!titleMatch) continue;

			const [, companyName, cik] = titleMatch;

			// Extract accession number from link or ID
			const id = this.extractXmlTag(entryXml, "id") || "";
			const accessionMatch = id.match(/accession-number=([0-9-]+)/);
			if (!accessionMatch) continue;

			const accessionNumber = accessionMatch[1];

			entries.push({
				accessionNumber,
				filingDate: updated,
				cik: cik.toString(),
				companyName: companyName.trim(),
				formType: "4",
				filingUrl: link,
			});
		}

		return entries;
	}

	/**
	 * Extract text content from an XML tag
	 */
	private extractXmlTag(xml: string, tagName: string): string | null {
		const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\/${tagName}>`, "i");
		const match = xml.match(regex);
		return match ? match[1].trim() : null;
	}

	/**
	 * Extract attribute value from an XML tag
	 */
	private extractXmlAttribute(xml: string, tagName: string, attrName: string): string | null {
		const regex = new RegExp(`<${tagName}[^>]*${attrName}=["']([^"']+)["']`, "i");
		const match = xml.match(regex);
		return match ? match[1] : null;
	}
}

/**
 * Create a singleton SEC EDGAR client instance
 */
export function createSECEdgarClient(userAgent?: string): SECEdgarClient {
	return new SECEdgarClient(userAgent);
}
