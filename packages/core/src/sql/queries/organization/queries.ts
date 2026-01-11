import { getDb } from "@starter/core/src/sql";
import type { Organization } from "@starter/core/src/sql/schema/auth";
import { members, organizations, users } from "@starter/core/src/sql/schema/auth";
import { and, eq, ilike, or } from "drizzle-orm";

type GetOrganizationBySlugArgs = {
	slug: string;
	userId: string;
}
export const getOrganizationBySlug = async ({ slug, userId }: GetOrganizationBySlugArgs) => {
	const db = getDb();
	const [organizationRow] = await db
		.select()
		.from(organizations)
		.leftJoin(members, eq(organizations.id, members.organizationId))
		.where(and(
			eq(organizations.slug, slug),
			eq(members.userId, userId)
		))
	return organizationRow || null;
};

export const getOrganizationById = async (
	id: string,
): Promise<Organization | null> => {
	const db = getDb();
	const [organizationRow] = await db
		.select()
		.from(organizations)
		.where(eq(organizations.id, id));
	return organizationRow || null;
};

export const listMembersOfOrganization = async (organizationId: string, search?: string|null) => {
	const db = getDb();
	if(!organizationId) {
		throw new Error("Organization ID is required");
	}
	if (search && search.length > 0) {
		// Use raw SQL query when search is provided to properly join and filter
		return await db
			.select({
				id: members.id,
				organizationId: members.organizationId,
				userId: members.userId,
				role: members.role,
				createdAt: members.createdAt,
				user: {
					id: users.id,
					name: users.name,
					email: users.email,
					emailVerified: users.emailVerified,
					image: users.image,
					createdAt: users.createdAt,
					updatedAt: users.updatedAt,
				}
			})
			.from(members)
			.leftJoin(users, eq(members.userId, users.id))
			.where(
				and(
					eq(members.organizationId, organizationId),
					or(
						ilike(users.name, `%${search}%`),
						ilike(users.email, `%${search}%`)
					)
				)
			)
			.limit(5);
	} else {
		// Use the simpler query API when no search is needed
		const result = await db.query.members.findMany({
			where: eq(members.organizationId, organizationId),
			with: {
				user: true,
			}
		});
		return result;
	}
};

export const isDomainAvailabile = async (domain: string): Promise<boolean> => {
	const db = getDb();
	const [organizationRow] = await db
		.select()
		.from(organizations)
		.where(eq(organizations.domain, domain));
	return !organizationRow;
};

/**
 * Gets the organization for a user or by organizationId
 */
export const getOrganizationForUser = async (
	args: { userId: string } | { organizationId: string },
): Promise<Organization | null> => {
	const db = getDb();
	if ("userId" in args) {
		const userMembership = await db.query.members.findFirst({
			where: eq(members.userId, args.userId),
		});
		const organizationId = userMembership?.organizationId;
		if (!organizationId) {
			return null;
		}
		return getOrganizationById(organizationId);
	} else {
		return getOrganizationById(args.organizationId);
	}
};

/**
 * Gets all organizations for a user with membership details
 */
export const getOrganizationsForUser = async (userId: string) => {
	const db = getDb();

	const result = await db
		.select({
			role: members.role,
			membershipCreatedAt: members.createdAt,
			organization: {
				id: organizations.id,
				name: organizations.name,
				slug: organizations.slug,
				logo: organizations.logo,
				createdAt: organizations.createdAt,
				updatedAt: organizations.updatedAt,
			},
		})
		.from(members)
		.innerJoin(organizations, eq(members.organizationId, organizations.id))
		.where(eq(members.userId, userId));

	return result;
};
