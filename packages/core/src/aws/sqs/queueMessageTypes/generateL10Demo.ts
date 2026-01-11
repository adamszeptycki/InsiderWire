import { z } from "zod";

export const GenerateL10DemoTaskSchema = z.object({
    task_type: z.literal("GENERATE_L10_DEMO"),
    demoId: z.string(),
});

export type GenerateL10DemoTask = z.infer<typeof GenerateL10DemoTaskSchema>;

