import { getDb } from "/core/src/sql";
import { organizations } from "/core/src/sql/schema/auth";
import { Factory } from "fishery";
import { v4 as uuidv4 } from 'uuid';

type OrganizationFactoryFields = typeof organizations.$inferInsert;

const organizationFactory = Factory.define<OrganizationFactoryFields>(({ sequence }) => ({
    id: uuidv4(),
    name: `Test Organization ${sequence}`,
    slug: `test-org-${sequence}`,
    domain: `testorg${sequence}.com`,
    vertical: "technology",
    tagLine: `Building amazing things ${sequence}`,
    aiModel: "gpt-4",
    styling: {},
    type: "company",
    logo: null,
    logoDocumentId: null,
    isPlaceholder: false,
    createdAt: new Date(),
    updatedAt: new Date(),
}));


async function createTestOrganization(overrides?: Partial<OrganizationFactoryFields>) {
    const db = getDb();
    const organizationData = organizationFactory.build(overrides);

    const [newOrganization] = await db.insert(organizations).values(organizationData).returning();
    return newOrganization;
  }

export { createTestOrganization, organizationFactory };
