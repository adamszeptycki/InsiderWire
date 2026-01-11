import { z } from "zod";

export const EmbeddingsQueueRecordSchema = z.object({
    id: z.string(),
});

export type EmbeddingsQueueMessage = z.infer<typeof EmbeddingsQueueRecordSchema>;

export type EmbeddingsQueuePushMessageToQueueArgs = {
    message: EmbeddingsQueueMessage;
    queue: 'EmbeddingsQueue'
}

