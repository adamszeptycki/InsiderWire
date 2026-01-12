import { dbUrl, secEdgarUserAgent, slackWebhookUrl } from "./config";

/**
 * Cron job for processing Form 4 filings
 * Runs every 2 hours to fetch and process recent SEC Form 4 filings
 */
export const form4ProcessorCron = new sst.aws.Cron("Form4Processor", {
	schedule: "rate(2 hours)", // Every 2 hours
	job: {
		handler: "packages/functions/form4-processor.handler",
		link: [dbUrl, slackWebhookUrl, secEdgarUserAgent],
		timeout: "5 minutes", // Allow time for processing
		memory: "1024 MB",
	},
});

/**
 * Cron job for generating daily digest
 * Runs once per day at 6 PM ET (23:00 UTC / 11 PM UTC)
 * Note: Adjust schedule based on your timezone preference
 */
export const dailyDigestCron = new sst.aws.Cron("DailyDigest", {
	schedule: "cron(0 23 * * ? *)", // Daily at 11 PM UTC (6 PM ET during standard time)
	job: {
		handler: "packages/functions/daily-digest.handler",
		link: [dbUrl, slackWebhookUrl],
		timeout: "2 minutes",
		memory: "512 MB",
	},
});
