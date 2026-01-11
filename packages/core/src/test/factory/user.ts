import { getDb } from "/core/src/sql";
import { members, users } from "/core/src/sql/schema/auth";
import { Factory } from "fishery";


type UserFactoryFields = typeof users.$inferInsert;
const userFactory = Factory.define<UserFactoryFields>(({ sequence }) => ({
    name: `Test User ${sequence}`,
    email: `testuser${sequence}@example.com`,
    emailVerified: true,
    isPremium: false,
    role: "user",
    banned: false,
    notificationEnabled: true,
}));


async function createTestUser(overrides?: Partial<UserFactoryFields>, organizationId?: string) {
    const db = getDb();
    const userData = userFactory.build(overrides);
    
    const [newUser] = await db.insert(users).values(userData).returning();
    if(organizationId) {
        await db.insert(members).values({
            userId: newUser.id,
            organizationId,
            role: "member",
            createdAt: new Date(),
        });
    }
    return newUser;
  }

/**
 * Creates a test user with a new organization and sets up membership
 * @param overrides - Optional overrides for the user creation
 * @returns Object containing the created user and organization
 */
async function createTestUserWithOrganization(overrides?: Partial<UserFactoryFields>) {
    const { createTestOrganization } = await import("/core/src/test/factory/organization");
    const organization = await createTestOrganization();
    const user = await createTestUser({ ...overrides }, organization.id);
    return { user, organization };
}

export { createTestUser, userFactory, createTestUserWithOrganization };
