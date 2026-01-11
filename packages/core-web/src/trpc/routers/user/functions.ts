import { TRPCError } from "@trpc/server";

export type OnboardingStep = "CreateOrganization" | "AcceptInvitation";

type AuthenticatedContext = {
	session: {
		user: {
			id: string;
			email: string;
			name: string;
		};
	};
	organization: {
		id: string;
	} | null;
};

/**
 * Get the currently authenticated user
 * This will return the user from the session
 */
export async function getCurrentUser({ ctx }: { ctx: AuthenticatedContext }) {
	try {
		if (!ctx.session?.user) {
			throw new TRPCError({
				code: "UNAUTHORIZED",
				message: "You must be logged in to access this resource",
			});
		}
		const requiredOnboardingSteps: Array<OnboardingStep> = [];

		if (!ctx.organization) {
			requiredOnboardingSteps.push("CreateOrganization");
		}

		return {
			id: ctx.session.user.id,
			name: ctx.session.user.name,
			email: ctx.session.user.email,
			requiredOnboardingSteps,
			organization: ctx.organization,
		};
	} catch (error) {
		console.error("Error fetching current user:", error);
		throw new TRPCError({
			code: "INTERNAL_SERVER_ERROR",
			message: "Failed to fetch user data",
		});
	}
}

/**
 * Mark the user as authenticated from the Electron application
 */
export async function markUserAuthenticatedFromElectron({ ctx }: { ctx: Omit<AuthenticatedContext, "organization"> }) {
	try {
		if (!ctx.session?.user) {
			throw new TRPCError({
				code: "UNAUTHORIZED",
				message: "You must be logged in to access this resource",
			});
		}

		// In the starter template we skip persistence and just acknowledge success.
		return { success: true };
	} catch (error) {
		console.error("Error marking user as authenticated from Electron:", error);
		throw new TRPCError({
			code: "INTERNAL_SERVER_ERROR",
			message: "Failed to mark user as authenticated from Electron",
		});
	}
}
