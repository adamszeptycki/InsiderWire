import {
	protectedProcedure,
	protectedProcedureWithOptionalOrganization,
	router,
} from "@starter/core-web/src/trpc/trpc";
import { getCurrentUser, markUserAuthenticatedFromElectron } from "./functions";

export const userRouter = router({
	/**
	 * Get the currently authenticated user
	 * This will return the user from the session
	 */
	me: protectedProcedureWithOptionalOrganization.query(async ({ ctx }) => {
		return getCurrentUser({ ctx });
	}),

	/**
	 * Mark the user as authenticated from the Electron application
	 */
	markAuthenticatedFromElectron: protectedProcedure.mutation(async ({ ctx }) => {
		return markUserAuthenticatedFromElectron({ ctx });
	}),
});
