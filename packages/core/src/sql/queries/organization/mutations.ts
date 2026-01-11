import { getDb } from "@starter/core/src/sql";
import type { Role } from "@starter/core/src/sql/schema";
import { members, type Organization, organizations } from "@starter/core/src/sql/schema/auth";
import { and, eq } from "drizzle-orm";

export type InsertOrganization = typeof organizations.$inferInsert;
export type InsertMember = typeof members.$inferInsert;

export const updateOrganization = async (
	id: string,
	data: Partial<InsertOrganization>,
): Promise<Organization | null> => {
	const db = getDb();
	const [updatedOrganization] = await db
		.update(organizations)
		.set(data)
		.where(eq(organizations.id, id))
		.returning();
	return updatedOrganization || null;
};

export const addUserToOrganization = async (data: InsertMember) => {
	const db = getDb();

	// Check if user-organization relationship already exists
	const existing = await db
		.select()
		.from(members)
		.where(
			and(
				eq(members.userId, data.userId),
				eq(members.organizationId, data.organizationId),
			),
		);

	if (existing.length > 0) {
		throw new Error("User is already a member of this organization");
	}

	const [newMember] = await db.insert(members).values(data).returning();
	return newMember;
};

export const removeUserFromOrganization = async (
	userId: string,
	organizationId: string,
) => {
	const db = getDb();
	const [removedMember] = await db
		.delete(members)
		.where(
			and(
				eq(members.userId, userId),
				eq(members.organizationId, organizationId),
			),
		)
		.returning();
	return removedMember;
};

export const updateUserRole = async (
	userId: string,
	organizationId: string,
	role: Role,
) => {
	const db = getDb();
	const [updatedMember] = await db
		.update(members)
		.set({ role })
		.where(
			and(
				eq(members.userId, userId),
				eq(members.organizationId, organizationId),
			),
		)
		.returning();
	return updatedMember;
};
