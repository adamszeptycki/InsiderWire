import { betterAuthSecret, dbUrl, resendApiKey } from "./config";
import { getDomain, router } from "./router";

export const nextJsPage = new sst.aws.Nextjs("StarterWeb", {
	link: [betterAuthSecret, dbUrl, resendApiKey],
	path: "packages/web",
	route: $app.stage === "prod" ? { router } : undefined,
	warm: 1,
	server: {
		timeout: "1 minute",
	},
	environment: {
		BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
		BETTER_AUTH_URL: getDomain({ protocol: "https", skipLocalhost: false }),
		NEXT_PUBLIC_BASE_URL: getDomain({ protocol: "https", skipLocalhost: false }),
	},
});
