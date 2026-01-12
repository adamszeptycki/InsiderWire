/**
 * Alert rules and thresholds for insider trading signals
 */

// Urgent alert thresholds
export const URGENT_ALERT_SCORE_THRESHOLD = 5.0; // Signal score magnitude
export const URGENT_ALERT_VALUE_THRESHOLD = 250_000; // Transaction value in USD

// Holdings change threshold
export const SIGNIFICANT_HOLDINGS_CHANGE_PERCENT = 10; // 10% change

// Cluster detection window
export const CLUSTER_DETECTION_DAYS = 7; // Look for trades within 7 days

// First activity detection window
export const FIRST_ACTIVITY_DAYS = 180; // 180 days (6 months)

// 90-day context for digests
export const DIGEST_CONTEXT_DAYS = 90;

// Daily digest schedule
export const DAILY_DIGEST_HOUR_ET = 18; // 6 PM Eastern Time

/**
 * Alert priority levels
 */
export enum AlertPriority {
	HIGH = "high", // Signal score ≥ 5.0
	MEDIUM = "medium", // Signal score 2.5-4.99
	LOW = "low", // Signal score < 2.5
}

/**
 * Get alert priority based on signal score magnitude
 */
export function getAlertPriority(signalScore: number): AlertPriority {
	const magnitude = Math.abs(signalScore);

	if (magnitude >= 5.0) {
		return AlertPriority.HIGH;
	}
	if (magnitude >= 2.5) {
		return AlertPriority.MEDIUM;
	}
	return AlertPriority.LOW;
}

/**
 * Format signal score for display with sign
 */
export function formatSignalScore(score: number): string {
	const sign = score >= 0 ? "+" : "";
	return `${sign}${score.toFixed(2)}`;
}

/**
 * Get emoji indicator for signal score
 */
export function getScoreEmoji(score: number): string {
	if (score >= 5.0) return "🚀"; // Strong buy signal
	if (score >= 2.5) return "📈"; // Moderate buy signal
	if (score > 0) return "✅"; // Weak buy signal
	if (score > -2.5) return "⚠️"; // Weak sell signal
	if (score > -5.0) return "📉"; // Moderate sell signal
	return "🔴"; // Strong sell signal
}
