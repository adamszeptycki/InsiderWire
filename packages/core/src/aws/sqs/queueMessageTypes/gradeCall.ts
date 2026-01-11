import { z } from "zod";

export const GradeCallTaskSchema = z.object({
    task_type: z.literal("GRADE_CALL"),
    callRecordId: z.string(),
    organizationId: z.string(),
});

export type GradeCallTask = z.infer<typeof GradeCallTaskSchema>;

