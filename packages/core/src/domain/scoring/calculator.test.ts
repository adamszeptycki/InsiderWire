import { describe, expect, it } from "vitest";
import {
	calculateHoldingsDelta,
	calculateSignalScore,
	isSignificantHoldingsChange,
	shouldTriggerUrgentAlert,
	type ScoreInput,
} from "./calculator";

describe("calculateSignalScore", () => {
	describe("basic buy transactions", () => {
		it("should calculate score for simple buy", () => {
			const input: ScoreInput = {
				transactionCode: "P",
				transactionValue: 100_000,
				insiderTitle: "Director",
			};

			const result = calculateSignalScore(input);

			// Base: +1, Size: log10(100000/10000) = log10(10) = 1.0, Role: 1.0
			// Score = (1) × 1.0 × 1.0 = 1.0
			expect(result.score).toBe(1.0);
			expect(result.breakdown.baseScore).toBe(1);
			expect(result.breakdown.sizeMultiplier).toBe(1.0);
			expect(result.breakdown.roleMultiplier).toBe(1.0);
			expect(result.breakdown.firstActivityBonus).toBe(0);
			expect(result.breakdown.clusterBonus).toBe(0);
		});

		it("should calculate score for CEO buy", () => {
			const input: ScoreInput = {
				transactionCode: "P",
				transactionValue: 500_000,
				insiderTitle: "Chief Executive Officer",
			};

			const result = calculateSignalScore(input);

			// Base: +1, Size: log10(500000/10000) = log10(50) ≈ 1.70, Role: 1.5
			// Score = (1) × 1.70 × 1.5 = 2.55
			expect(result.score).toBeCloseTo(2.55, 1);
			expect(result.breakdown.baseScore).toBe(1);
			expect(result.breakdown.sizeMultiplier).toBeCloseTo(1.70, 2);
			expect(result.breakdown.roleMultiplier).toBe(1.5);
		});

		it("should calculate score for CFO buy", () => {
			const input: ScoreInput = {
				transactionCode: "P",
				transactionValue: 250_000,
				insiderTitle: "CFO",
			};

			const result = calculateSignalScore(input);

			// Base: +1, Size: log10(250000/10000) = log10(25) ≈ 1.40, Role: 1.5
			// Score = (1) × 1.40 × 1.5 = 2.10
			expect(result.score).toBeCloseTo(2.1, 1);
			expect(result.breakdown.roleMultiplier).toBe(1.5);
		});

		it("should calculate score for Chairman buy", () => {
			const input: ScoreInput = {
				transactionCode: "P",
				transactionValue: 1_000_000,
				insiderTitle: "Chairman of the Board",
			};

			const result = calculateSignalScore(input);

			// Base: +1, Size: log10(1000000/10000) = log10(100) = 2.0, Role: 1.5
			// Score = (1) × 2.0 × 1.5 = 3.0
			expect(result.score).toBe(3.0);
			expect(result.breakdown.roleMultiplier).toBe(1.5);
		});
	});

	describe("basic sell transactions", () => {
		it("should calculate negative score for sell", () => {
			const input: ScoreInput = {
				transactionCode: "S",
				transactionValue: 100_000,
				insiderTitle: "Director",
			};

			const result = calculateSignalScore(input);

			// Base: -1, Size: log10(100000/10000) = 1.0, Role: 1.0
			// Score = (-1) × 1.0 × 1.0 = -1.0
			expect(result.score).toBe(-1.0);
			expect(result.breakdown.baseScore).toBe(-1);
		});

		it("should calculate negative score for CEO sell", () => {
			const input: ScoreInput = {
				transactionCode: "S",
				transactionValue: 1_000_000,
				insiderTitle: "CEO",
			};

			const result = calculateSignalScore(input);

			// Base: -1, Size: log10(1000000/10000) = 2.0, Role: 1.5
			// Score = (-1) × 2.0 × 1.5 = -3.0
			expect(result.score).toBe(-3.0);
		});
	});

	describe("first activity bonus", () => {
		it("should add +1 for first activity", () => {
			const input: ScoreInput = {
				transactionCode: "P",
				transactionValue: 100_000,
				insiderTitle: "Director",
				isFirstActivityIn180Days: true,
			};

			const result = calculateSignalScore(input);

			// Base: +1, FirstActivity: +1, Size: 1.0, Role: 1.0
			// Score = (1 + 1) × 1.0 × 1.0 = 2.0
			expect(result.score).toBe(2.0);
			expect(result.breakdown.firstActivityBonus).toBe(1);
		});

		it("should apply first activity bonus with role multiplier", () => {
			const input: ScoreInput = {
				transactionCode: "P",
				transactionValue: 500_000,
				insiderTitle: "CEO",
				isFirstActivityIn180Days: true,
			};

			const result = calculateSignalScore(input);

			// Base: +1, FirstActivity: +1, Size: log10(50) ≈ 1.70, Role: 1.5
			// Score = (1 + 1) × 1.70 × 1.5 = 5.10
			expect(result.score).toBeCloseTo(5.1, 1);
		});
	});

	describe("cluster bonus", () => {
		it("should add cluster bonus for multiple insiders", () => {
			const input: ScoreInput = {
				transactionCode: "P",
				transactionValue: 100_000,
				insiderTitle: "Director",
				additionalInsidersInCluster: 2,
			};

			const result = calculateSignalScore(input);

			// Base: +1, Cluster: +2, Size: 1.0, Role: 1.0
			// Score = (1 + 2) × 1.0 × 1.0 = 3.0
			expect(result.score).toBe(3.0);
			expect(result.breakdown.clusterBonus).toBe(2);
		});

		it("should combine cluster bonus with first activity and role multiplier", () => {
			const input: ScoreInput = {
				transactionCode: "P",
				transactionValue: 500_000,
				insiderTitle: "Chief Executive Officer",
				isFirstActivityIn180Days: true,
				additionalInsidersInCluster: 2,
			};

			const result = calculateSignalScore(input);

			// Base: +1, FirstActivity: +1, Cluster: +2, Size: log10(50) ≈ 1.70, Role: 1.5
			// Score = (1 + 1 + 2) × 1.70 × 1.5 = 10.20
			expect(result.score).toBeCloseTo(10.2, 1);
		});
	});

	describe("size multiplier edge cases", () => {
		it("should use minimum multiplier of 1.0 for small transactions", () => {
			const input: ScoreInput = {
				transactionCode: "P",
				transactionValue: 5_000, // Below $10k threshold
				insiderTitle: "Director",
			};

			const result = calculateSignalScore(input);

			// Size: max(1.0, log10(5000/10000)) = max(1.0, -0.30) = 1.0
			expect(result.breakdown.sizeMultiplier).toBe(1.0);
			expect(result.score).toBe(1.0);
		});

		it("should calculate correctly for very large transactions", () => {
			const input: ScoreInput = {
				transactionCode: "P",
				transactionValue: 10_000_000, // $10M
				insiderTitle: "CEO",
			};

			const result = calculateSignalScore(input);

			// Size: log10(10000000/10000) = log10(1000) = 3.0, Role: 1.5
			// Score = (1) × 3.0 × 1.5 = 4.5
			expect(result.score).toBe(4.5);
			expect(result.breakdown.sizeMultiplier).toBe(3.0);
		});
	});

	describe("real-world scenarios", () => {
		it("should match example: Strong Buy Signal", () => {
			// CEO buys $500k, first purchase in 6+ months, 2 other executives also bought
			const input: ScoreInput = {
				transactionCode: "P",
				transactionValue: 500_000,
				insiderTitle: "CEO",
				isFirstActivityIn180Days: true,
				additionalInsidersInCluster: 2,
			};

			const result = calculateSignalScore(input);

			// (1 + 1 + 2) × log10(50) × 1.5 ≈ 4 × 1.70 × 1.5 = 10.20
			expect(result.score).toBeCloseTo(10.2, 1);
		});

		it("should match example: Strong Sell Signal", () => {
			// CFO sells $1M
			const input: ScoreInput = {
				transactionCode: "S",
				transactionValue: 1_000_000,
				insiderTitle: "CFO",
			};

			const result = calculateSignalScore(input);

			// (-1) × log10(100) × 1.5 = -1 × 2.0 × 1.5 = -3.0
			expect(result.score).toBe(-3.0);
		});

		it("should match example: Moderate Buy Signal", () => {
			// Director buys $100k
			const input: ScoreInput = {
				transactionCode: "P",
				transactionValue: 100_000,
				insiderTitle: "Director",
			};

			const result = calculateSignalScore(input);

			// (1) × log10(10) × 1.0 = 1.0
			expect(result.score).toBe(1.0);
		});
	});
});

describe("shouldTriggerUrgentAlert", () => {
	it("should trigger for score magnitude >= 5.0", () => {
		expect(shouldTriggerUrgentAlert(5.0, 100_000)).toBe(true);
		expect(shouldTriggerUrgentAlert(-5.0, 100_000)).toBe(true);
		expect(shouldTriggerUrgentAlert(6.5, 50_000)).toBe(true);
		expect(shouldTriggerUrgentAlert(-7.2, 30_000)).toBe(true);
	});

	it("should trigger for transaction value >= $250k", () => {
		expect(shouldTriggerUrgentAlert(2.0, 250_000)).toBe(true);
		expect(shouldTriggerUrgentAlert(1.0, 300_000)).toBe(true);
		expect(shouldTriggerUrgentAlert(-2.0, 500_000)).toBe(true);
	});

	it("should not trigger for low score and low value", () => {
		expect(shouldTriggerUrgentAlert(4.9, 240_000)).toBe(false);
		expect(shouldTriggerUrgentAlert(2.0, 100_000)).toBe(false);
		expect(shouldTriggerUrgentAlert(-4.0, 150_000)).toBe(false);
	});

	it("should trigger if either condition is met", () => {
		expect(shouldTriggerUrgentAlert(5.1, 100)).toBe(true);
		expect(shouldTriggerUrgentAlert(0.5, 250_000)).toBe(true);
	});
});

describe("calculateHoldingsDelta", () => {
	it("should calculate positive delta for increased holdings", () => {
		const delta = calculateHoldingsDelta(100_000, 150_000);
		expect(delta).toBe(50.0); // +50%
	});

	it("should calculate negative delta for decreased holdings", () => {
		const delta = calculateHoldingsDelta(100_000, 75_000);
		expect(delta).toBe(-25.0); // -25%
	});

	it("should return 0 for zero prior holdings", () => {
		const delta = calculateHoldingsDelta(0, 10_000);
		expect(delta).toBe(0);
	});

	it("should handle small percentage changes", () => {
		const delta = calculateHoldingsDelta(1_000_000, 1_005_000);
		expect(delta).toBe(0.5); // +0.5%
	});

	it("should handle large percentage changes", () => {
		const delta = calculateHoldingsDelta(10_000, 50_000);
		expect(delta).toBe(400.0); // +400%
	});

	it("should handle complete liquidation", () => {
		const delta = calculateHoldingsDelta(100_000, 0);
		expect(delta).toBe(-100.0); // -100%
	});
});

describe("isSignificantHoldingsChange", () => {
	it("should return true for changes >= 10%", () => {
		expect(isSignificantHoldingsChange(10.0)).toBe(true);
		expect(isSignificantHoldingsChange(15.5)).toBe(true);
		expect(isSignificantHoldingsChange(-10.0)).toBe(true);
		expect(isSignificantHoldingsChange(-25.0)).toBe(true);
	});

	it("should return false for changes < 10%", () => {
		expect(isSignificantHoldingsChange(9.9)).toBe(false);
		expect(isSignificantHoldingsChange(5.0)).toBe(false);
		expect(isSignificantHoldingsChange(-9.9)).toBe(false);
		expect(isSignificantHoldingsChange(-5.0)).toBe(false);
	});

	it("should handle exactly 10%", () => {
		expect(isSignificantHoldingsChange(10.0)).toBe(true);
		expect(isSignificantHoldingsChange(-10.0)).toBe(true);
	});

	it("should handle zero change", () => {
		expect(isSignificantHoldingsChange(0.0)).toBe(false);
	});
});
