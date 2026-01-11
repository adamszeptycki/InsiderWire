import { z } from "zod";

export const GetChatTitleTaskSchema = z.object({
    task_type: z.literal("GET_CHAT_TITLE"),
    chatId: z.uuid(),
    organizationId: z.uuid(),
    ownerId: z.uuid(),
});

export type GetChatTitleTask = z.infer<typeof GetChatTitleTaskSchema>;

