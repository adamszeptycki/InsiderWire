"use client";

interface SignalScoreBadgeProps {
	score: number | string;
	size?: "sm" | "md" | "lg";
}

export function SignalScoreBadge({ score, size = "md" }: SignalScoreBadgeProps) {
	const scoreNum = typeof score === "string" ? Number.parseFloat(score) : score;
	const magnitude = Math.abs(scoreNum);

	// Determine color based on score magnitude and direction
	const getColorClass = () => {
		if (scoreNum >= 5.0) return "badge-success"; // Strong buy
		if (scoreNum >= 2.5) return "badge-info"; // Moderate buy
		if (scoreNum > 0) return "badge-accent"; // Weak buy
		if (scoreNum > -2.5) return "badge-warning"; // Weak sell
		if (scoreNum > -5.0) return "badge-warning"; // Moderate sell
		return "badge-error"; // Strong sell
	};

	// Emoji indicator
	const getEmoji = () => {
		if (scoreNum >= 5.0) return "🚀";
		if (scoreNum >= 2.5) return "📈";
		if (scoreNum > 0) return "✅";
		if (scoreNum > -2.5) return "⚠️";
		if (scoreNum > -5.0) return "📉";
		return "🔴";
	};

	const sizeClass = {
		sm: "badge-sm",
		md: "badge-md",
		lg: "badge-lg",
	}[size];

	const formatted = scoreNum >= 0 ? `+${scoreNum.toFixed(2)}` : scoreNum.toFixed(2);

	return (
		<div className={`badge ${getColorClass()} ${sizeClass} gap-1 font-mono font-bold`}>
			<span>{getEmoji()}</span>
			<span>{formatted}</span>
		</div>
	);
}
