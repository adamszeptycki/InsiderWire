import { z } from "zod";

export const HubspotSyncTaskSchema = z.object({
	task_type: z.literal("HUBSPOT_SYNC"),
	organizationId: z.string().uuid(),
	triggeredBy: z.enum(["cron", "manual"]),
	userId: z.uuid().optional(),
	/** If true, ignores lastSyncAt and fetches all records from HubSpot */
	fullSync: z.boolean().optional(),
});

export type HubspotSyncTask = z.infer<typeof HubspotSyncTaskSchema>;


