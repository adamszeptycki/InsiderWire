export type SecretName = "DB_URL" | "BETTER_AUTH_SECRET" | "RESEND_API_KEY";

const getSecret = (name: SecretName) => {
	const envValue = process.env[name];
	if (envValue) return envValue;
	// In the template, fall back to placeholder values.
	switch (name) {
		case "DB_URL":
			return "postgres://postgres:postgres@localhost:5937/starter";
		case "BETTER_AUTH_SECRET":
			return "starter-better-auth-secret";
		case "RESEND_API_KEY":
			return "resend-api-placeholder";
	}
};

export { getSecret };