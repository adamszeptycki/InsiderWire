import { Resource } from "sst";
import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
const { Pool } = pkg;
import { createForm4Processor } from "@starter/core/src/domain/pipeline";

/**
 * Cron handler for processing Form 4 filings
 * Runs every 2 hours to fetch and process recent SEC Form 4 filings
 */
export const handler = async (event: any) => {
	console.log("[Form4ProcessorCron] Starting Form 4 processing job...");
	console.log("[Form4ProcessorCron] Event:", JSON.stringify(event, null, 2));

	try {
		// Create database connection
		const pool = new Pool({
			connectionString: Resource.DB_URL.value,
		});
		const db = drizzle(pool);

		// Create processor and run
		const processor = createForm4Processor(db);
		const stats = await processor.process(100); // Fetch up to 100 recent filings

		console.log("[Form4ProcessorCron] Processing complete:", stats);

		// Close database connection
		await pool.end();

		return {
			statusCode: 200,
			body: JSON.stringify({
				message: "Form 4 processing complete",
				stats,
			}),
		};
	} catch (error) {
		console.error("[Form4ProcessorCron] Error:", error);

		return {
			statusCode: 500,
			body: JSON.stringify({
				message: "Form 4 processing failed",
				error: error instanceof Error ? error.message : "Unknown error",
			}),
		};
	}
};
