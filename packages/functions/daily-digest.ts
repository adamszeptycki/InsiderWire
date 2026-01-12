import { Resource } from "sst";
import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
const { Pool } = pkg;
import { createDailyDigestAggregator } from "@starter/core/src/domain/pipeline";

/**
 * Cron handler for generating daily digest
 * Runs once per day at 6 PM ET to generate and post digest for yesterday's transactions
 */
export const handler = async (event: any) => {
	console.log("[DailyDigestCron] Starting daily digest generation...");
	console.log("[DailyDigestCron] Event:", JSON.stringify(event, null, 2));

	try {
		// Create database connection
		const pool = new Pool({
			connectionString: Resource.DB_URL.value,
		});
		const db = drizzle(pool);

		// Create aggregator and generate digest for yesterday
		const aggregator = createDailyDigestAggregator(db);
		const stats = await aggregator.generateYesterdayDigest();

		console.log("[DailyDigestCron] Digest generation complete:", stats);

		// Close database connection
		await pool.end();

		return {
			statusCode: 200,
			body: JSON.stringify({
				message: "Daily digest generation complete",
				stats,
			}),
		};
	} catch (error) {
		console.error("[DailyDigestCron] Error:", error);

		return {
			statusCode: 500,
			body: JSON.stringify({
				message: "Daily digest generation failed",
				error: error instanceof Error ? error.message : "Unknown error",
			}),
		};
	}
};
