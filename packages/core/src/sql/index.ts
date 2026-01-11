import { AsyncLocalStorage } from "node:async_hooks";
import * as DrizzleSchema from "@starter/core/src/sql/schema";
import { sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { drizzle } from "drizzle-orm/node-postgres";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { Pool } from "pg";
import { getDatabaseCredentials } from "./credentials";

type DbContext = {
	db: NodePgDatabase<typeof DrizzleSchema>;
};
const dbContext = new AsyncLocalStorage<DbContext>();

export const runInDbContext = (
	db: NodePgDatabase<typeof DrizzleSchema>,
	fn: () => unknown,
) => {
	return dbContext.run({ db }, fn);
};

const getDrizzleLocalPg = (
	connectionString: string,
): NodePgDatabase<typeof DrizzleSchema> => {
	const pool = new Pool({
		connectionString: connectionString,
		max: 500,
	});

	// const client = postgres(connectionString, { prepare: false, max: 20 });
	return drizzle(pool, { schema: DrizzleSchema });
};
export type DBType =
	| NodePgDatabase<typeof DrizzleSchema>
	| PostgresJsDatabase<typeof DrizzleSchema>;

let _client: DBType;

const getDb = (): DBType => {
	if (_client) return _client;
	const dbCredentials = getDatabaseCredentials();

	_client = getDrizzleLocalPg(dbCredentials.databaseUrl);
	return _client;
};



export type DBTransaction = Parameters<Parameters<DBType["transaction"]>[0]>[0];

export {getDb, DrizzleSchema as schema};

