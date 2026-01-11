import { getDb } from "@starter/core/src/sql";
import { type InsertUser, users } from "@starter/core/src/sql/schema/auth";
import { eq } from "drizzle-orm";

const updateUserById = async (id: string, data: Partial<InsertUser>) => {
    const db = getDb();
    const [updatedUser] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return updatedUser;
};

export { updateUserById };