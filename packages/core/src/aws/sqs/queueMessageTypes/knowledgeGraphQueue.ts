import { z } from "zod";

export const KnowledgeGraphQueueMessageSchema = z.object({
    documentId: z.string(),
});

export type KnowledgeGraphQueueMessage = z.infer<typeof KnowledgeGraphQueueMessageSchema>;

export type KnowledgeGraphQueuePushMessageToQueueArgs = {
    message: KnowledgeGraphQueueMessage;
    queue: 'KnowledgeGraphQueue'
}

