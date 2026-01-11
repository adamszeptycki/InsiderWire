import type { inferRouterOutputs } from "@trpc/server";
import { createTRPCRouter } from "../trpc";
import { organizationRouter } from "./organization/router";
import { userRouter } from "./user/router";
/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
	user: userRouter,
	organization: organizationRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
