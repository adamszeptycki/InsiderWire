"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { trpc } from "@starter/web/src/utils/trpc";
import { SignalScoreBadge } from "@starter/web/src/components/insiders/SignalScoreBadge";

export default function TransactionPage() {
	const params = useParams();
	const id = params.id as string;

	const { data, isLoading, error } = trpc.insiders.get.useQuery({ id });

	if (isLoading) {
		return (
			<div className="flex justify-center py-12">
				<span className="loading loading-spinner loading-lg" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="alert alert-error">
				<span>Error loading transaction: {error.message}</span>
			</div>
		);
	}

	if (!data) {
		return (
			<div className="alert alert-warning">
				<span>Transaction not found</span>
			</div>
		);
	}

	const tickerDisplay = data.issuer.ticker || data.issuer.companyName;
	const accessionNoDashes = data.filingAccession.replace(/-/g, "");
	const cikPadded = data.issuer.cik.padStart(10, "0");
	const filingUrl = `https://www.sec.gov/cgi-bin/viewer?action=view&cik=${cikPadded}&accession_number=${data.filingAccession}&xbrl_type=v`;

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center gap-4">
				<Link href="/dashboard/insiders" className="btn btn-ghost btn-sm">
					← Back
				</Link>
				<div>
					<h1 className="text-3xl font-bold">Transaction Details</h1>
					<p className="text-base-content/60">Filed on {data.createdAt.toLocaleString()}</p>
				</div>
			</div>

			{/* Main Card */}
			<div className="card bg-base-100 shadow-xl">
				<div className="card-body">
					<div className="flex items-start justify-between">
						<div>
							<h2 className="card-title text-2xl">
								{tickerDisplay} -{" "}
								{data.transactionCode === "P" ? "Insider Buy" : "Insider Sell"}
							</h2>
							<p className="text-base-content/60">{data.issuer.companyName}</p>
						</div>
						<SignalScoreBadge score={data.signalScore} size="lg" />
					</div>

					<div className="divider" />

					{/* Insider Information */}
					<div className="space-y-2">
						<h3 className="text-lg font-semibold">Reporting Owner</h3>
						<div className="grid grid-cols-2 gap-4">
							<div>
								<p className="text-sm text-base-content/60">Name</p>
								<p className="font-medium">{data.insider.name}</p>
							</div>
							<div>
								<p className="text-sm text-base-content/60">Title</p>
								<p className="font-medium">{data.insider.title || "N/A"}</p>
							</div>
						</div>
					</div>

					<div className="divider" />

					{/* Transaction Details */}
					<div className="space-y-2">
						<h3 className="text-lg font-semibold">Transaction Details</h3>
						<div className="grid grid-cols-2 gap-4">
							<div>
								<p className="text-sm text-base-content/60">Transaction Date</p>
								<p className="font-medium">
									{new Date(data.transactionDate).toLocaleDateString()}
								</p>
							</div>
							<div>
								<p className="text-sm text-base-content/60">Action</p>
								<p className="font-medium">
									{data.transactionCode === "P" ? (
										<span className="badge badge-success">BUY</span>
									) : (
										<span className="badge badge-error">SELL</span>
									)}
								</p>
							</div>
							<div>
								<p className="text-sm text-base-content/60">Shares</p>
								<p className="font-medium font-mono">
									{Number.parseFloat(data.shares).toLocaleString(undefined, {
										maximumFractionDigits: 0,
									})}
								</p>
							</div>
							<div>
								<p className="text-sm text-base-content/60">Price Per Share</p>
								<p className="font-medium font-mono">
									${Number.parseFloat(data.price).toFixed(2)}
								</p>
							</div>
							<div>
								<p className="text-sm text-base-content/60">Total Value</p>
								<p className="font-medium font-mono text-lg">
									$
									{Number.parseFloat(data.transactionValue).toLocaleString(undefined, {
										maximumFractionDigits: 0,
									})}
								</p>
							</div>
							<div>
								<p className="text-sm text-base-content/60">Post-Transaction Holdings</p>
								<p className="font-medium font-mono">
									{Number.parseFloat(data.postTransactionShares).toLocaleString(undefined, {
										maximumFractionDigits: 0,
									})}{" "}
									shares
								</p>
							</div>
							<div>
								<p className="text-sm text-base-content/60">Ownership Type</p>
								<p className="font-medium">
									{data.isDirectOwnership ? "Direct" : "Indirect"}
								</p>
							</div>
							<div>
								<p className="text-sm text-base-content/60">10b5-1 Trading Plan</p>
								<p className="font-medium">{data.is10b51 ? "Yes" : "No"}</p>
							</div>
						</div>
					</div>

					{data.is10b51 && (
						<div className="alert alert-info">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								className="stroke-current shrink-0 w-6 h-6"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth="2"
									d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
							<span>
								This transaction was made pursuant to a Rule 10b5-1 trading plan, which may
								indicate the trade was pre-planned.
							</span>
						</div>
					)}

					<div className="divider" />

					{/* SEC Filing Link */}
					<div className="card-actions justify-end">
						<a
							href={filingUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="btn btn-primary"
						>
							View SEC Form 4 Filing
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								strokeWidth={1.5}
								stroke="currentColor"
								className="w-5 h-5"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
								/>
							</svg>
						</a>
					</div>
				</div>
			</div>
		</div>
	);
}
