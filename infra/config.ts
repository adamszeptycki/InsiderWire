export const betterAuthSecret = new sst.Secret(
	"BETTER_AUTH_SECRET",
	"better-auth-placeholder-key",
);
export const dbUrl = new sst.Secret(
	"DB_URL",
	"postgres://postgres:postgres@localhost:5937/insiderwire",
);
export const resendApiKey = new sst.Secret(
	"RESEND_API_KEY",
	"resend-api-placeholder-key",
);
