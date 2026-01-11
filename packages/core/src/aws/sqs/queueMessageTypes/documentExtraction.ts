import { z } from "zod";

export const DocumentExtractionTaskSchema = z.object({
    documentId: z.string(),
});

export type DocumentExtractionTask = z.infer<typeof DocumentExtractionTaskSchema>;

export type DocumentExtractionPushMessageToQueueArgs = {
    message: DocumentExtractionTask;
    queue: 'DocumentExtraction'
}

