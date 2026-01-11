"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignInPage() {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setLoading(true);
		setError(null);
		try {
			const res = await fetch("/api/auth/sign-in/email", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, password }),
			});
			if (!res.ok) {
				throw new Error("Sign-in failed");
			}
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
				<h1 className="mb-4 text-center text-2xl font-bold">Sign In</h1>
				<form className="space-y-4" onSubmit={handleSubmit}>
					<label className="block">
						<span className="text-sm font-medium">Email</span>
						<input
							type="email"
							required
							className="mt-1 w-full rounded border px-3 py-2 text-sm text-black"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
						/>
					</label>
					<label className="block">
						<span className="text-sm font-medium">Password</span>
						<input
							type="password"
							required
							className="mt-1 w-full rounded border px-3 py-2 text-sm text-black"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
						/>
					</label>
					<button
						type="submit"
						className="w-full rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-60"
						disabled={loading}
					>
						{loading ? "Signing in..." : "Sign In"}
					</button>
					{error ? <p className="text-sm text-red-500">{error}</p> : null}
				</form>
				<p className="mt-4 text-center text-sm text-muted-foreground">
					Need an account? <a href="/auth/sign-up" className="text-blue-500 hover:underline">Sign up</a>
				</p>
			</div>
		</div>
	);
}
