"use client";

import Link from "next/link";
import { SignalScoreBadge } from "./SignalScoreBadge";

interface Transaction {
	id: string;
	transactionDate: string;
	transactionCode: string;
	shares: string;
	price: string;
	transactionValue: string;
	signalScore: string;
	issuer: {
		ticker: string | null;
		companyName: string;
	};
	insider: {
		name: string;
		title: string | null;
	};
}

interface TransactionListProps {
	transactions: Transaction[];
	showTicker?: boolean;
}

export function TransactionList({ transactions, showTicker = true }: TransactionListProps) {
	if (transactions.length === 0) {
		return (
			<div className="text-center py-12 text-base-content/60">
				No transactions found matching your criteria.
			</div>
		);
	}

	return (
		<div className="overflow-x-auto">
			<table className="table table-zebra">
				<thead>
					<tr>
						<th>Date</th>
						{showTicker && <th>Ticker</th>}
						<th>Insider</th>
						<th>Action</th>
						<th className="text-right">Shares</th>
						<th className="text-right">Price</th>
						<th className="text-right">Value</th>
						<th>Signal Score</th>
					</tr>
				</thead>
				<tbody>
					{transactions.map((tx) => (
						<tr key={tx.id} className="hover">
							<td>
								<Link
									href={`/dashboard/transaction/${tx.id}`}
									className="link link-hover text-sm"
								>
									{new Date(tx.transactionDate).toLocaleDateString()}
								</Link>
							</td>
							{showTicker && (
								<td>
									<Link
										href={`/dashboard/ticker/${tx.issuer.ticker || encodeURIComponent(tx.issuer.companyName)}`}
										className="link link-primary font-semibold"
									>
										{tx.issuer.ticker || tx.issuer.companyName}
									</Link>
								</td>
							)}
							<td>
								<div>
									<div className="font-medium">{tx.insider.name}</div>
									{tx.insider.title && (
										<div className="text-sm text-base-content/60">{tx.insider.title}</div>
									)}
								</div>
							</td>
							<td>
								{tx.transactionCode === "P" ? (
									<span className="badge badge-success badge-sm">BUY</span>
								) : (
									<span className="badge badge-error badge-sm">SELL</span>
								)}
							</td>
							<td className="text-right font-mono text-sm">
								{Number.parseFloat(tx.shares).toLocaleString(undefined, {
									maximumFractionDigits: 0,
								})}
							</td>
							<td className="text-right font-mono text-sm">
								${Number.parseFloat(tx.price).toFixed(2)}
							</td>
							<td className="text-right font-mono text-sm">
								$
								{Number.parseFloat(tx.transactionValue).toLocaleString(undefined, {
									maximumFractionDigits: 0,
								})}
							</td>
							<td>
								<SignalScoreBadge score={tx.signalScore} />
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
