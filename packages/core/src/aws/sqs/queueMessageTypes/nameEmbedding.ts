import { z } from "zod";

export const NameEmbeddingTaskSchema = z.object({
    task_type: z.literal("NAME_EMBEDDING"),
    documentChunkId: z.string(),
});

export type NameEmbeddingTask = z.infer<typeof NameEmbeddingTaskSchema>;

