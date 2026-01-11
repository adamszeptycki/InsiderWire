import { z } from "zod";

export const HandleOrgDataTaskSchema = z.object({
    orgDataId: z.string(),
    task_type: z.literal("HANDLE_ORG_DATA"),
});

export type HandleOrgDataTask = z.infer<typeof HandleOrgDataTaskSchema>;

