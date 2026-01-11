import { llmRequestTypeOptions } from "/core/src/sql/schema/enums";
import { z } from "zod";

export const SaveLlmRequestTaskSchema = z.object({
    task_type: z.literal("SAVE_LLM_REQUEST"),
    type: z.enum(llmRequestTypeOptions),
    organizationId: z.uuid(),
    ownerId: z.string().optional().nullable(),
    chatId: z.uuid().optional().nullable(),
    documentId: z.uuid().optional().nullable(),
    documentChunkId: z.uuid().optional().nullable(),
    requestId: z.string(),
    inputTokens: z.number(),
    outputTokens: z.number(),
});

export type SaveLlmRequestTask = z.infer<typeof SaveLlmRequestTaskSchema>;

