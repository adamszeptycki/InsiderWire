import { z } from "zod";

export const ExtractQuestionsFromDocumentTaskSchema = z.object({
    documentId: z.uuid(),
    task_type: z.literal("EXTRACT_QUESTIONS_FROM_DOCUMENT"),
});

export type ExtractQuestionsFromDocumentTask = z.infer<typeof ExtractQuestionsFromDocumentTaskSchema>;

