import { z } from "zod";

export const RewritePromptsForNewOrganizationTaskSchema = z.object({
    organizationId: z.uuid(),
    task_type: z.literal("REWRITE_PROMPTS_FOR_NEW_ORGANIZATION"),
});

export type RewritePromptsForNewOrganizationTask = z.infer<typeof RewritePromptsForNewOrganizationTaskSchema>;

