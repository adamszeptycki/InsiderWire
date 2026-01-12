"use client";

import { trpc } from "@starter/web/src/utils/trpc";
import { TransactionList } from "@starter/web/src/components/insiders/TransactionList";
import Link from "next/link";

export default function DashboardPage() {
	const { data, isLoading, error } = trpc.insiders.highlights.useQuery();

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">Insider Trading Signals</h1>
					<p className="text-base-content/60 mt-1">
						Recent high-score insider transactions (past 7 days)
					</p>
				</div>
				<Link href="/dashboard/insiders" className="btn btn-primary">
					View All Transactions
				</Link>
			</div>

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
				<div className="card bg-base-100 shadow-xl">
					<div className="card-body">
						<h2 className="card-title">High-Score Transactions</h2>
						<TransactionList transactions={data.transactions} />
					</div>
				</div>
			)}
		</div>
	);
}