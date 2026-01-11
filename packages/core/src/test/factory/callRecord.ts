import { getDb } from "/core/src/sql";
import type { CallRecordInsert } from "/core/src/sql/schema/call";
import { callsRecords } from "/core/src/sql/schema/call";
import type { TranscriptTurn } from "/types/src/transcript/types";
import { Factory } from "fishery";
import { v4 as uuidv4 } from "uuid";

type CallRecordFactoryFields = CallRecordInsert;

const callRecordFactory = Factory.define<CallRecordFactoryFields>(
    ({ params, sequence }) => {
        const defaultTranscript: TranscriptTurn[] = [
            {
                turn_order: 1,
                transcript: `Test call transcript ${sequence}`,
                start_time: 0,
                end_time: 5,
                confidence: 0.95,
                words: [],
                is_final: true,
                channel: "system_audio",
            },
        ];

        return {
            id: uuidv4(),
            organizationId: params.organizationId ?? "",
            ownerId: params.ownerId ?? "",
            transcript: params.transcript ?? defaultTranscript,
            feedback: params.feedback ?? "neutral",
            type: params.type ?? "inbound",
            lengthInSeconds: params.lengthInSeconds ?? 300,
            tags: params.tags ?? ["test", "sample"],
            prospectId: params.prospectId ?? null,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
    },
);

/**
 * Creates a test call record
 * @param overrides - Optional overrides for the call record creation
 * @returns The created call record
 */
async function createTestCallRecord(
    overrides?: Partial<CallRecordFactoryFields>,
) {
    const db = getDb();
    const callRecordData = callRecordFactory.build(overrides);

    const [newCallRecord] = await db
        .insert(callsRecords)
        .values(callRecordData)
        .returning();
    return newCallRecord;
}

/**
 * Creates multiple test call records
 * @param count - Number of call records to create
 * @param organizationId - Organization ID for the call records
 * @param ownerId - Owner ID for the call records
 * @param overrides - Optional overrides for the call record creation
 * @returns Array of created call records
 */
async function createMultipleTestCallRecords(
    count: number,
    organizationId: string,
    ownerId: string,
    overrides?: Partial<CallRecordFactoryFields>,
) {
    const callRecords: Awaited<ReturnType<typeof createTestCallRecord>>[] = [];
    for (let i = 0; i < count; i++) {
        const callRecord = await createTestCallRecord({
            ...overrides,
            organizationId,
            ownerId,
        });
        callRecords.push(callRecord);
    }
    return callRecords;
}

export {
    createTestCallRecord,
    createMultipleTestCallRecords,
    callRecordFactory,
};
