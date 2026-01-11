export default function Home() {
	return (
		<div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-16">
			<header className="flex flex-col gap-2">
				<p className="text-sm uppercase tracking-wide text-slate-400">
					Starter Template
				</p>
				<h1 className="text-4xl font-semibold text-white">
					Better Auth + tRPC + Drizzle + Next.js starter
				</h1>
				<p className="text-slate-300">
					A minimal foundation with authentication, organizations, and a clean
					monorepo structure. Build your product features on top of this
					template.
				</p>
			</header>

			<section className="grid gap-4 sm:grid-cols-2">
				<div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
					<h3 className="text-lg font-medium text-white">Authentication</h3>
					<p className="text-sm text-slate-300">
						Better Auth wired with Drizzle schema and Next.js API routes.
					</p>
				</div>
				<div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
					<h3 className="text-lg font-medium text-white">API layer</h3>
					<p className="text-sm text-slate-300">
						tRPC server/client setup ready for your procedures.
					</p>
				</div>
				<div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
					<h3 className="text-lg font-medium text-white">Database</h3>
					<p className="text-sm text-slate-300">
						Drizzle ORM against Postgres with auth/organization tables.
					</p>
				</div>
				<div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
					<h3 className="text-lg font-medium text-white">Monorepo</h3>
					<p className="text-sm text-slate-300">
						SST + pnpm workspaces so you can add packages as needed.
					</p>
				</div>
			</section>
		</div>
	);
}
