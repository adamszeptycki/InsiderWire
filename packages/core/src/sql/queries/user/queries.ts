import { getDb } from "@starter/core/src/sql";
import type { Organization, User } from "@starter/core/src/sql/schema/auth";
import { members, organizations, users } from "@starter/core/src/sql/schema/auth";
import { eq } from "drizzle-orm";

// Type definition for getUserWithOrganizations return value
export type UserWithOrganizations = User & {
	primaryOrganization: Organization | null;
	organizationMemberships: Array<{
		role: string;
		membershipCreatedAt: Date;
		organization: Organization;
	}>;
};

export const getUserById = async (id: string) => {
	const db = getDb();
	const [user] = await db.select().from(users).where(eq(users.id, id));
	return user;
};

/**
 * Returns a user with their associated organization information.
 * Gets organization memberships via the members table.
 * @param userId - The ID of the user
 * @returns User with organization memberships and roles
 */
export const getUserWithOrganizations = async (
	userId: string,
): Promise<UserWithOrganizations | null> => {
	const db = getDb();

	// First query: Get user data
	const userResult = await db
		.select({
			id: users.id,
			name: users.name,
			email: users.email,
			emailVerified: users.emailVerified,
			image: users.image,
			role: users.role,
			createdAt: users.createdAt,
			updatedAt: users.updatedAt,
		})
		.from(users)
		.where(eq(users.id, userId));

	if (!userResult.length) {
		return null;
	}

	// Second query: Get organization memberships with full organization details
	const membershipsResult = await db
		.select({
			role: members.role,
			membershipCreatedAt: members.createdAt,
			organization: {
				id: organizations.id,
				name: organizations.name,
				domain: organizations.domain,
				slug: organizations.slug,
				logo: organizations.logo,
				type: organizations.type,
				createdAt: organizations.createdAt,
				updatedAt: organizations.updatedAt,
				isPlaceholder: organizations.isPlaceholder,
			},
		})
		.from(members)
		.innerJoin(organizations, eq(members.organizationId, organizations.id))
		.where(eq(members.userId, userId));

	const user = userResult[0];

	// For now, we'll consider the first organization (if any) as the "primary" one
	// This can be enhanced later with proper primary organization logic
	const primaryOrganization =
		membershipsResult.length > 0 ? membershipsResult[0].organization : null;

	return {
		id: user.id,
		name: user.name,
		email: user.email,
		emailVerified: user.emailVerified,
		image: user.image,
		role: user.role,
		createdAt: user.createdAt,
		updatedAt: user.updatedAt,
		primaryOrganization: primaryOrganization,
		organizationMemberships: membershipsResult,
	};
};

type GetOrganizationForUserArgs =
	| {
			userId: string;
	  }
	| {
			organizationId: string;
	  };

export const getOrganizationForUser = async (
	args: GetOrganizationForUserArgs,
) => {
	const db = getDb();
	if ("userId" in args) {
		const userMembership = await db.query.members.findFirst({
			where: eq(members.userId, args.userId),
		});
		const organizationId = userMembership?.organizationId;
		if (!organizationId) {
			throw new Error("User not found or not a member of any organization");
		}
		return getOrganizationById(organizationId);
	} else {
		return getOrganizationById(args.organizationId);
	}
};

export const getOrganizationById = async (id: string) => {
	const db = getDb();
	const [organizationRow] = await db
		.select()
		.from(organizations)
		.where(eq(organizations.id, id));
	return organizationRow;
};
