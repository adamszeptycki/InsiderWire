"use client";

import { useState } from "react";
import { trpc } from "@starter/web/src/utils/trpc";
import { TransactionList } from "@starter/web/src/components/insiders/TransactionList";

export default function InsidersPage() {
	const [ticker, setTicker] = useState("");
	const [minScore, setMinScore] = useState("");
	const [startDate, setStartDate] = useState("");
	const [endDate, setEndDate] = useState("");

	const { data, isLoading, error } = trpc.insiders.list.useQuery({
		ticker: ticker || undefined,
		minScore: minScore ? Number.parseFloat(minScore) : undefined,
		startDate: startDate || undefined,
		endDate: endDate || undefined,
		limit: 50,
		offset: 0,
	});

	const handleReset = () => {
		setTicker("");
		setMinScore("");
		setStartDate("");
		setEndDate("");
	};

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold">All Insider Transactions</h1>
				<p className="text-base-content/60 mt-1">
					Search and filter insider trading transactions
				</p>
			</div>

			{/* Filters */}
			<div className="card bg-base-100 shadow-xl">
				<div className="card-body">
					<h2 className="card-title">Filters</h2>
					<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
						<div className="form-control">
							<label className="label">
								<span className="label-text">Ticker Symbol</span>
							</label>
							<input
								type="text"
								placeholder="e.g. AAPL"
								className="input input-bordered"
								value={ticker}
								onChange={(e) => setTicker(e.target.value.toUpperCase())}
							/>
						</div>
						<div className="form-control">
							<label className="label">
								<span className="label-text">Min Signal Score</span>
							</label>
							<input
								type="number"
								placeholder="e.g. 2.5"
								step="0.1"
								className="input input-bordered"
								value={minScore}
								onChange={(e) => setMinScore(e.target.value)}
							/>
						</div>
						<div className="form-control">
							<label className="label">
								<span className="label-text">Start Date</span>
							</label>
							<input
								type="date"
								className="input input-bordered"
								value={startDate}
								onChange={(e) => setStartDate(e.target.value)}
							/>
						</div>
						<div className="form-control">
							<label className="label">
								<span className="label-text">End Date</span>
							</label>
							<input
								type="date"
								className="input input-bordered"
								value={endDate}
								onChange={(e) => setEndDate(e.target.value)}
							/>
						</div>
					</div>
					<div className="card-actions justify-end mt-4">
						<button className="btn btn-ghost" onClick={handleReset}>
							Reset Filters
						</button>
					</div>
				</div>
			</div>

			{/* Results */}
			<div className="card bg-base-100 shadow-xl">
				<div className="card-body">
					{isLoading && (
						<div className="flex justify-center py-12">
							<span className="loading loading-spinner loading-lg" />
						</div>
					)}

					{error && (
						<div className="alert alert-error">
							<span>Error loading transactions: {error.message}</span>
						</div>
					)}

					{data && (
						<>
							<div className="flex items-center justify-between mb-4">
								<h2 className="card-title">
									Transactions
									<span className="badge badge-neutral">{data.total}</span>
								</h2>
							</div>
							<TransactionList transactions={data.transactions} />
							{data.hasMore && (
								<div className="alert alert-info mt-4">
									<span>Showing {data.transactions.length} of {data.total} transactions</span>
								</div>
							)}
						</>
					)}
				</div>
			</div>
		</div>
	);
}
