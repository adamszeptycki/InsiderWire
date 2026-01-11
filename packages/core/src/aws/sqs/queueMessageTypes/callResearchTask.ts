import { z } from "zod";

export const CallResearchTaskSchema = z.object({
	task_type: z.literal("CALL_RESEARCH"),
	taskId: z.string(),
	organizationId: z.string(),
	userId: z.string(),
});

export type CallResearchTask = z.infer<typeof CallResearchTaskSchema>;

