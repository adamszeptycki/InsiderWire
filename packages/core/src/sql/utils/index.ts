import { sql } from "drizzle-orm";
import { timestamp, uuid } from "drizzle-orm/pg-core";

const defaultFields = {
	id: uuid("id").primaryKey().notNull().default(sql`gen_random_uuid()`),
	createdAt: timestamp("created_at").notNull().default(sql`now()`),
	updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
};


const timestamps: { createdAt: true; updatedAt: true } = {
	createdAt: true,
	updatedAt: true,
};

export { defaultFields, timestamps };
