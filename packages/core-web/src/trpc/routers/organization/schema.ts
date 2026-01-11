import { z } from "zod";

export const CreateTenantSchema = z.object({
	name: z.string().min(1),
	domain: z.string().min(1),
	type: z.enum(["company", "individual"]).default("company"),
});
export type CreateTenantArgs = z.infer<typeof CreateTenantSchema>;
