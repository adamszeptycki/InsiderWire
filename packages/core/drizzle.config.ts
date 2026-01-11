import type { Config } from "drizzle-kit";
import { defineConfig } from "drizzle-kit";
import { getDatabaseCredentials } from "src/sql/credentials";

const dbCredentials = getDatabaseCredentials();

const config: Config = {
	dialect: "postgresql",
	schema: "./src/sql/schema/*",
	out: "./src/sql/migrations/",
	dbCredentials: {
		url: dbCredentials.databaseUrl,
	},
	// Print all statements
	// verbose: true,
	// Always ask for confirmation
	strict: true,
};

export default defineConfig(config);
