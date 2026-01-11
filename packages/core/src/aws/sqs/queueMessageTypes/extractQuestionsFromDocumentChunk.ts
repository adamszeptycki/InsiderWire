import { z } from "zod";

export const ExtractQuestionsFromDocumentChunkTaskSchema = z.object({
    documentChunkId: z.uuid(),
    task_type: z.literal("EXTRACT_QUESTIONS_FROM_DOCUMENT_CHUNK"),
});

export type ExtractQuestionsFromDocumentChunkTask = z.infer<typeof ExtractQuestionsFromDocumentChunkTaskSchema>;

