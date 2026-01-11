export function getDomain({
	protocol,
	skipLocalhost,
}: { protocol?: string; skipLocalhost?: boolean }): string {
	let result: string;
	switch ($app.stage) {
		case "prod":
			result = "starter-template.com";
			break;
		default:
			result = skipLocalhost ? "starter-template.local" : "https://localhost:3000";
	}
	if (protocol && !result.startsWith("http")) {
		result = `${protocol}://${result}`;
	}
	return result;
}

const domain = getDomain({ skipLocalhost: true });

export const router = new sst.aws.Router("StarterRouter", {
	domain: {
		name: domain,
		aliases: [`*.${domain}`],
	},
});
