import { getDb } from "/core/src/sql";
import { prospects } from "/core/src/sql/schema/call";
import { Factory } from "fishery";
import { v4 as uuidv4 } from "uuid";
import type { ProspectInsert } from "/core/src/sql/schema/call";

type ProspectFactoryFields = ProspectInsert;

const prospectFactory = Factory.define<ProspectFactoryFields>(
    ({ params, sequence }) => ({
        id: uuidv4(),
        organizationId: params.organizationId as string,
        ownerId: params.ownerId as string,
        fullName: params.fullName || `Test Prospect ${sequence}`,
        companyName: params.companyName || `Test Company ${sequence}`,
        createdAt: new Date(),
        updatedAt: new Date(),
    }),
);

/**
 * Creates a test prospect
 * @param overrides - Optional overrides for the prospect creation
 * @returns The created prospect
 */
async function createTestProspect(
    overrides?: Partial<ProspectFactoryFields>,
) {
    const db = getDb();
    const prospectData = prospectFactory.build(overrides);

    const [newProspect] = await db
        .insert(prospects)
        .values(prospectData)
        .returning();
    return newProspect;
}

/**
 * Creates multiple test prospects
 * @param count - Number of prospects to create
 * @param organizationId - Organization ID for the prospects
 * @param ownerId - Owner ID for the prospects
 * @param overrides - Optional overrides for the prospect creation
 * @returns Array of created prospects
 */
async function createMultipleTestProspects(
    count: number,
    organizationId: string,
    ownerId: string,
    overrides?: Partial<ProspectFactoryFields>,
) {
    const prospects: Awaited<ReturnType<typeof createTestProspect>>[] = [];
    for (let i = 0; i < count; i++) {
        const prospect = await createTestProspect({
            ...overrides,
            organizationId,
            ownerId,
        });
        prospects.push(prospect);
    }
    return prospects;
}

export {
    createTestProspect,
    createMultipleTestProspects,
    prospectFactory,
};
