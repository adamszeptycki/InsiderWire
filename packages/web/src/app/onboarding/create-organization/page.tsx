"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CreateTenantPage() {
	const router = useRouter();
	const [name, setName] = useState("");
	const [slug, setSlug] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setLoading(true);
		setError(null);
		try {
			const res = await fetch("/api/trpc/organization.create", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name, domain: slug }),
				credentials: "include",
			});
			if (!res.ok) throw new Error("Organization creation failed");
			router.push("/dashboard");
		} catch (err) {
			setError((err as Error).message);
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="flex flex-1 items-center justify-center bg-background p-6">
			<div className="w-full max-w-md rounded-lg border p-6 shadow-lg sm:p-8">
				<h1 className="mb-4 text-center text-2xl font-bold">Create Organization</h1>
				<form className="space-y-4" onSubmit={handleSubmit}>
					<label className="block">
						<span className="text-sm font-medium">Name</span>
						<input
							type="text"
							required
							className="mt-1 w-full rounded border px-3 py-2 text-sm text-black"
							value={name}
							onChange={(e) => setName(e.target.value)}
						/>
					</label>
					<label className="block">
						<span className="text-sm font-medium">Slug</span>
						<input
							type="text"
							required
							className="mt-1 w-full rounded border px-3 py-2 text-sm text-black"
							value={slug}
							onChange={(e) => setSlug(e.target.value)}
						/>
					</label>
					<button
						type="submit"
						className="w-full rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-60"
						disabled={loading}
					>
						{loading ? "Creating..." : "Create"}
					</button>
					{error ? <p className="text-sm text-red-500">{error}</p> : null}
				</form>
			</div>
		</div>
	);
}