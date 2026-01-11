import { getDb } from "/core/src/sql";
import { prompts } from "/core/src/sql/schema/prompt/prompt";
import { promptVersions } from "/core/src/sql/schema/prompt/promptVersion";
import { Factory } from "fishery";

type PromptFactoryFields = typeof prompts.$inferInsert;
type PromptVersionFactoryFields = typeof promptVersions.$inferInsert

const promptFactory = Factory.define<PromptFactoryFields>(({ params, sequence }) => ({
    ownerId: params.ownerId as string | undefined,
    organizationId: params.organizationId as string | undefined,
    key: params.key || `test-prompt-${sequence}`,
    name: params.name || `Test Prompt ${sequence}`,
    description: params.description || `Test prompt description ${sequence}`,
}));

const promptVersionFactory = Factory.define<PromptVersionFactoryFields>(({ params, sequence }) => {
    if (!params.content) {
        params.content = { main: `Test prompt content ${sequence}` };
    }
    return {
        promptId: params.promptId as string,
        ownerId: params.ownerId as string | undefined,
        version: params.version || sequence,
        content: params.content as Record<string,string>,
        outputFormat: params.outputFormat || "text",
    }
});

/**
 * Creates a test prompt
 * @param overrides - Optional overrides for the prompt creation
 * @returns The created prompt record
 */
async function createTestPrompt(overrides?: Partial<PromptFactoryFields>) {
    const db = getDb();
    const promptData = promptFactory.build(overrides);

    const [newPrompt] = await db.insert(prompts).values(promptData).returning();
    return newPrompt;
}

/**
 * Creates a test prompt version
 * @param promptId - The ID of the prompt this version belongs to
 * @param overrides - Optional overrides for the prompt version creation
 * @returns The created prompt version record
 */
async function createTestPromptVersion(promptId: string, overrides?: Partial<PromptVersionFactoryFields>) {
    const db = getDb();
    const versionData = promptVersionFactory.build({
        version: 1,
        ...overrides,
        promptId,
    });

    const [newVersion] = await db.insert(promptVersions).values(versionData).returning();
    return newVersion;
}

/**
 * Creates a test prompt with a version
 * @param overrides - Optional overrides for the prompt creation
 * @param versionOverrides - Optional overrides for the prompt version creation
 * @returns Object containing the created prompt and prompt version
 */
async function createTestPromptWithVersion(
    overrides?: Partial<PromptFactoryFields>,
    versionOverrides?: Partial<PromptVersionFactoryFields>
) {
    const prompt = await createTestPrompt(overrides);
    const version = await createTestPromptVersion(prompt.id, versionOverrides);

    return { prompt, version };
}

/**
 * Creates a test prompt with multiple versions
 * @param overrides - Optional overrides for the prompt creation
 * @param versionCount - Number of versions to create (default: 2)
 * @param versionOverrides - Optional overrides for each prompt version creation
 * @returns Object containing the created prompt and array of prompt versions
 */
async function createTestPromptWithVersions(
    overrides?: Partial<PromptFactoryFields>,
    versionCount: number = 2,
    versionOverrides?: Partial<PromptVersionFactoryFields>
) {
    const prompt = await createTestPrompt(overrides);
    const versions: Array<Awaited<ReturnType<typeof createTestPromptVersion>>> = [];

    for (let i = 1; i <= versionCount; i++) {
        const version = await createTestPromptVersion(prompt.id, {
            ...versionOverrides,
            version: i,
        });
        versions.push(version);
    }

    return { prompt, versions };
}

/**
 * Creates a test prompt with version for a specific organization
 * @param organizationId - The ID of the organization
 * @param ownerId - The ID of the owner (optional)
 * @param overrides - Optional overrides for the prompt creation
 * @param versionOverrides - Optional overrides for the prompt version creation
 * @returns Object containing the created prompt and prompt version
 */
async function createTestPromptWithVersionForOrganization(
    organizationId: string,
    ownerId?: string,
    overrides?: Partial<PromptFactoryFields>,
    versionOverrides?: Partial<PromptVersionFactoryFields>
) {
    const prompt = await createTestPrompt({
        ...overrides,
        organizationId,
        ownerId,
    });
    const version = await createTestPromptVersion(prompt.id, {
        ...versionOverrides,
        ownerId,
    });

    return { prompt, version };
}

export {
    promptFactory,
    promptVersionFactory,
    createTestPrompt,
    createTestPromptVersion,
    createTestPromptWithVersion,
    createTestPromptWithVersions,
    createTestPromptWithVersionForOrganization,
};
