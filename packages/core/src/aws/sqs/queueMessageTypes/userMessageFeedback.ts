import { feedbackDataTypeOptions, feedbackTypeOptions } from "/core/src/sql/schema/enums";
import { z } from "zod";

export const UserMessageFeedbackQueueMessageSchema = z.object({
    ownerId: z.string(),
    task_type: z.literal("USER_MESSAGE_FEEDBACK"),
    organizationId: z.string(),
    feedbackDataType: z.enum(feedbackDataTypeOptions).optional().nullable(),
    feedbackType: z.enum(feedbackTypeOptions).optional().nullable(),
    questionMessageId: z.string(),
    answerMessageId: z.string(),
    suggestionText: z.string().optional().nullable(),
    websiteUrl: z.string().optional().nullable(),
    documentId: z.string().optional().nullable(),
});

export type UserMessageFeedbackQueueMessage = z.infer<typeof UserMessageFeedbackQueueMessageSchema>;

