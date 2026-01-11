import { getSecret } from "@starter/core/src/config/secret";

type DatabaseCredentials = {
	databaseUrl: string;
};

const getDatabaseCredentials = (): DatabaseCredentials => {
	if (process.env.DATABASE_URL) {
		return {
			databaseUrl: process.env.DATABASE_URL,
		};
	}

	const dbUrl = getSecret("DB_URL");
	if (!dbUrl) throw new Error("DB credentials not found");
	return {
		databaseUrl: dbUrl,
	};
};
export { getDatabaseCredentials };
