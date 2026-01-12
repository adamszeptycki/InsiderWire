"use client";

import { useParams } from "next/navigation";
import { trpc } from "@starter/web/src/utils/trpc";
import { TransactionList } from "@starter/web/src/components/insiders/TransactionList";
import Link from "next/link";

export default function TickerPage() {
	const params = useParams();
	const symbol = decodeURIComponent(params.symbol as string);

	const { data, isLoading, error } = trpc.insiders.tickerStats.useQuery({
		ticker: symbol,
		daysBack: 90,
	});

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center gap-4">
				<Link href="/dashboard/insiders" className="btn btn-ghost btn-sm">
					← Back
				</Link>
				<div>
					<h1 className="text-3xl font-bold">{symbol}</h1>
					{data && (
						<p className="text-base-content/60">{data.issuer.companyName}</p>
					)}
				</div>
			</div>

			{isLoading && (
				<div className="flex justify-center py-12">
					<span className="loading loading-spinner loading-lg" />
				</div>
			)}

			{error && (
				<div className="alert alert-error">
					<span>Error loading ticker data: {error.message}</span>
				</div>
			)}

			{data && (
				<>
					{/* Stats Cards */}
					<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
						<div className="card bg-base-100 shadow">
							<div className="card-body">
								<h2 className="card-title text-sm">Total Transactions</h2>
								<p className="text-3xl font-bold">{data.stats.totalTransactions}</p>
								<p className="text-xs text-base-content/60">Last {data.stats.daysBack} days</p>
							</div>
						</div>
						<div className="card bg-base-100 shadow">
							<div className="card-body">
								<h2 className="card-title text-sm">Buys / Sells</h2>
								<p className="text-3xl font-bold">
									{data.stats.buyCount} / {data.stats.sellCount}
								</p>
								<p className="text-xs text-base-content/60">
									{data.stats.buyCount > data.stats.sellCount ? "📈 More buying" : "📉 More selling"}
								</p>
							</div>
						</div>
						<div className="card bg-base-100 shadow">
							<div className="card-body">
								<h2 className="card-title text-sm">Total Value</h2>
								<p className="text-3xl font-bold">
									${data.stats.totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
								</p>
								<p className="text-xs text-base-content/60">Aggregate transaction value</p>
							</div>
						</div>
						<div className="card bg-base-100 shadow">
							<div className="card-body">
								<h2 className="card-title text-sm">Avg Signal Score</h2>
								<p className="text-3xl font-bold">
									{data.stats.avgScore >= 0 ? "+" : ""}
									{data.stats.avgScore}
								</p>
								<p className="text-xs text-base-content/60">Average across all transactions</p>
							</div>
						</div>
					</div>

					{/* Recent Transactions */}
					<div className="card bg-base-100 shadow-xl">
						<div className="card-body">
							<h2 className="card-title">Recent Transactions</h2>
							<TransactionList transactions={data.recentTransactions} showTicker={false} />
						</div>
					</div>
				</>
			)}
		</div>
	);
}
