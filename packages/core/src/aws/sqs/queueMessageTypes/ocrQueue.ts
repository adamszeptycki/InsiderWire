import { z } from "zod";

export const OcrQueueMessageSchema = z.object({
    id: z.string(),
    s3Key: z.string().optional().nullable(),
    bucketName: z.string().optional().nullable(),
    embeddingType: z.enum(["semantic", "naive"]).default("semantic"),
});

export type OcrQueueMessage = z.infer<typeof OcrQueueMessageSchema>;

export type OcrQueuePushMessageToQueueArgs = {
    message: OcrQueueMessage;
    queue: 'OcrQueue'
}

