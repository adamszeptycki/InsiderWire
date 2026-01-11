import { getDb } from "/core/src/sql";
import type { ScoreCardInsert } from "/core/src/sql/schema/call";
import { scoreCard } from "/core/src/sql/schema/call";
import { Factory } from "fishery";
import { v4 as uuidv4 } from "uuid";

type ScoreCardFactoryFields = ScoreCardInsert;

const scoreCardFactory = Factory.define<ScoreCardFactoryFields>(
    ({ params, sequence }) => ({
        id: uuidv4(),
        organizationId: params.organizationId as string,
        score: params.score || 85,
        aiSuggestion: params.aiSuggestion || `Test AI suggestion ${sequence}`,
        callId: params.callId as string,
        createdAt: new Date(),
        updatedAt: new Date(),
    }),
);

/**
 * Creates a test score card
 * @param overrides - Optional overrides for the score card creation
 * @returns The created score card
 */
async function createTestScoreCard(
    overrides?: Partial<ScoreCardFactoryFields>,
) {
    const db = getDb();
    const scoreCardData = scoreCardFactory.build(overrides);

    const [newScoreCard] = await db
        .insert(scoreCard)
        .values(scoreCardData)
        .returning();
    return newScoreCard;
}

/**
 * Creates multiple test score cards
 * @param count - Number of score cards to create
 * @param callId - Call ID for the score cards
 * @param organizationId - Organization ID for the score cards
 * @param overrides - Optional overrides for the score card creation
 * @returns Array of created score cards
 */
async function createMultipleTestScoreCards(
    count: number,
    callId: string,
    organizationId: string,
    overrides?: Partial<ScoreCardFactoryFields>,
) {
    const scoreCards: Awaited<ReturnType<typeof createTestScoreCard>>[] = [];
    for (let i = 0; i < count; i++) {
        const scoreCard = await createTestScoreCard({
            ...overrides,
            callId,
            organizationId,
        });
        scoreCards.push(scoreCard);
    }
    return scoreCards;
}

export { createMultipleTestScoreCards, createTestScoreCard, scoreCardFactory };
