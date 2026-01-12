import { isExecutiveRole } from "../sec/types";

export interface ScoreInput {
	transactionCode: string; // 'P' = buy, 'S' = sell
	transactionValue: number; // Total value in dollars
	insiderTitle?: string; // Job title (for role multiplier)
	isFirstActivityIn180Days?: boolean; // First trade in 180+ days
	additionalInsidersInCluster?: number; // Number of additional insiders trading same ticker in 7-day window
}

export interface ScoreResult {
	score: number; // Final calculated signal score
	breakdown: {
		baseScore: number;
		sizeMultiplier: number;
		roleMultiplier: number;
		firstActivityBonus: number;
		clusterBonus: number;
	};
}

/**
 * Calculate signal score for an insider transaction
 *
 * Formula per specs:
 * - Base: Buy (+1), Sell (-1)
 * - Size multiplier: log10(transaction_value / $10,000)
 * - Role multiplier: CEO/CFO/Chair (×1.5)
 * - First activity bonus: First trade in ≥180 days (+1)
 * - Cluster bonus: ≥2 insiders same ticker within 7 days (+1 per additional insider)
 *
 * Final score = (Base + FirstActivityBonus + ClusterBonus) × SizeMultiplier × RoleMultiplier
 */
export function calculateSignalScore(input: ScoreInput): ScoreResult {
	// 1. Base score
	const baseScore = input.transactionCode === "P" ? 1 : -1;

	// 2. Size multiplier: log10(transaction_value / 10,000)
	// Ensure minimum of 1.0 (don't penalize small transactions below threshold)
	const sizeMultiplier = Math.max(1.0, Math.log10(input.transactionValue / 10_000));

	// 3. Role multiplier: 1.5 for executives, 1.0 otherwise
	const roleMultiplier = isExecutiveRole(input.insiderTitle) ? 1.5 : 1.0;

	// 4. First activity bonus: +1 if first trade in 180+ days
	const firstActivityBonus = input.isFirstActivityIn180Days ? 1 : 0;

	// 5. Cluster bonus: +1 per additional insider beyond the first
	const clusterBonus = input.additionalInsidersInCluster || 0;

	// Final calculation
	const score =
		(baseScore + firstActivityBonus + clusterBonus) * sizeMultiplier * roleMultiplier;

	return {
		score: Number(score.toFixed(2)), // Round to 2 decimal places
		breakdown: {
			baseScore,
			sizeMultiplier: Number(sizeMultiplier.toFixed(2)),
			roleMultiplier,
			firstActivityBonus,
			clusterBonus,
		},
	};
}

/**
 * Check if a transaction meets the urgent alert threshold
 * Per specs: Signal score magnitude ≥ 5.0 OR transaction value ≥ $250k
 */
export function shouldTriggerUrgentAlert(
	signalScore: number,
	transactionValue: number,
): boolean {
	return Math.abs(signalScore) >= 5.0 || transactionValue >= 250_000;
}

/**
 * Calculate holdings delta percentage (for alert messaging)
 * @param priorHoldings Previous holdings amount
 * @param postTransactionHoldings Holdings after transaction
 * @returns Percentage change (positive = increase, negative = decrease)
 */
export function calculateHoldingsDelta(
	priorHoldings: number,
	postTransactionHoldings: number,
): number {
	if (priorHoldings === 0) return 0; // Avoid division by zero

	const delta = ((postTransactionHoldings - priorHoldings) / priorHoldings) * 100;
	return Number(delta.toFixed(2));
}

/**
 * Check if holdings change is significant (≥10% change)
 */
export function isSignificantHoldingsChange(deltaPercent: number): boolean {
	return Math.abs(deltaPercent) >= 10;
}
