import { z } from "zod";

export const EvalQueueMessageSchema = z.object({
    feedbackId: z.string(),
});

export type EvalQueueMessage = z.infer<typeof EvalQueueMessageSchema>;

export type EvalQueuePushMessageToQueueArgs = {
    message: EvalQueueMessage;
    queue: 'EvalQueue'
}

