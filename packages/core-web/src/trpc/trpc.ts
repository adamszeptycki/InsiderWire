import { auth } from "@starter/core-web/src/auth/auth";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import type { Context } from "./context";

const t = initTRPC.context<Context>().create({
	transformer: superjson,
	errorFormatter({ shape, error }) {
		return {
			...shape,
			data: {
				...shape.data,
				zodError:
					error.cause instanceof ZodError ? error.cause.flatten() : null,
			},
		};
	},
});

/**
 * Create a server-side caller
 * @see https://trpc.io/docs/server/routers
 */
export const createTRPCRouter = t.router;

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your
 * tRPC API. It does not guarantee that a user querying is authorized, but you
 * can still access user session data if they are logged in.
 */
export const publicProcedure = t.procedure;

/**
 * Create a server-side caller
 * @see https://trpc.io/docs/server/routers
 */
export const router = t.router;

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your
 * tRPC API. It does not guarantee that a user querying is authorized, but you
 * can still access user session data if they are logged in.
 */
export const procedure = t.procedure;

/** Reusable middleware that enforces users are logged in before running the procedure. */
const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
	if (!ctx.session?.user) {
		throw new TRPCError({ code: "UNAUTHORIZED" });
	}
	return next({
		ctx: {
			...ctx,
			// infers the `session` as non-nullable
			session: { ...ctx.session, user: ctx.session.user },
		},
	});
});

/** Reusable middleware that enforces users are logged in and loads their organization information. */
const enforceUserIsAuthedWithOrganization = t.middleware(async ({ ctx, next }) => {
	if (!ctx.session?.user) {
		throw new TRPCError({ code: "UNAUTHORIZED" });
	}

	// Get the active organization using Better Auth's session data
	// Better Auth stores activeOrganizationId in the session when organization plugin is used
	const activeOrganizationId = ctx.session.session.activeOrganizationId;

	if (!activeOrganizationId) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "User does not have an active organization"
		});
	}

	// Get the organization details using Better Auth API
	const organizationResult = await auth.api.getFullOrganization({
		headers: ctx.headers,
		query: {
			organizationId: activeOrganizationId,
		},
	});

	if (!organizationResult) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Organization not found"
		});
	}

	return next({
		ctx: {
			...ctx,
			// infers the `session` as non-nullable and adds organization
			session: { ...ctx.session, user: ctx.session.user },
			organization: organizationResult,
		},
	});
});

/** Reusable middleware that enforces users are logged in and optionally loads their organization information. */
const enforceUserIsAuthedWithOptionalOrganization = t.middleware(async ({ ctx, next }) => {
	if (!ctx.session?.user) {
		throw new TRPCError({ code: "UNAUTHORIZED" });
	}

	// Attempt to load organization information, but don't fail if user has no organization
	let organization: any = null;
	try {
		const activeOrganizationId = (ctx.session as any).activeOrganizationId;
		if (activeOrganizationId) {
			const organizationResult = await auth.api.getFullOrganization({
				headers: ctx.headers,
				query: {
					organizationId: activeOrganizationId,
				},
			});
			organization = organizationResult || null;
		}
		if (!organization) {
			const organizations = await auth.api.listOrganizations({
				headers: ctx.headers,
			});
			organization = organizations[0] || null;
		}
	} catch (error) {
		// User might not have an organization yet, which is okay for some procedures
		console.warn(`Could not load organization for user ${ctx.session.user.id}:`, error);
	}

	return next({
		ctx: {
			...ctx,
			// infers the `session` as non-nullable and adds optional organization
			session: { ...ctx.session, user: ctx.session.user },
			organization,
		},
	});
});

/**
 * Protected (authenticated) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use this. It verifies
 * the session is valid and guarantees `ctx.session.user` is not null.
 *
 * @see https://trpc.io/docs/procedures
 */
export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);

/**
 * Protected procedure with organization
 * 
 * Use this for procedures that require the user to be authenticated and have an active organization.
 * It guarantees `ctx.session.user` and `ctx.organization` are not null.
 */
export const protectedProcedureWithOrganization = t.procedure.use(enforceUserIsAuthedWithOrganization);

/**
 * Protected procedure with optional organization
 * 
 * Use this for procedures that require the user to be authenticated but organization is optional.
 * It guarantees `ctx.session.user` is not null, but `ctx.organization` might be null.
 * Useful for onboarding flows where users might not have created an organization yet.
 */
export const protectedProcedureWithOptionalOrganization = t.procedure.use(enforceUserIsAuthedWithOptionalOrganization);

/** Reusable middleware that enforces users are admin or owner in their organization */
const enforceUserIsAdmin = t.middleware(async ({ ctx, next }) => {
	if (!ctx.session?.user) {
		throw new TRPCError({ code: "UNAUTHORIZED" });
	}

	const activeOrganizationId = ctx.session.session.activeOrganizationId;

	if (!activeOrganizationId) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "User does not have an active organization"
		});
	}

	// Get the organization details using Better Auth API
	const organizationResult = await auth.api.getFullOrganization({
		headers: ctx.headers,
		query: {
			organizationId: activeOrganizationId,
		},
	});

	if (!organizationResult) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Organization not found"
		});
	}

	// Check if user is admin or owner
	const userMember = organizationResult.members.find(
		(member) => member.userId === ctx.session?.user.id
	);

	if (!userMember || (userMember.role !== "admin" && userMember.role !== "owner")) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "User must be an admin or owner to access this resource"
		});
	}

	return next({
		ctx: {
			...ctx,
			session: { ...ctx.session, user: ctx.session.user },
			organization: organizationResult,
		},
	});
});

/**
 * Protected procedure with admin access
 * 
 * Use this for procedures that require the user to be authenticated and have admin or owner role.
 * It guarantees `ctx.session.user` and `ctx.organization` are not null, and user is admin/owner.
 */
export const protectedProcedureWithAdmin = t.procedure.use(enforceUserIsAdmin);

/** Reusable middleware that enforces users are superadmins (global admin role) with organization */
const enforceUserIsSuperadmin = t.middleware(async ({ ctx, next }) => {
	if (!ctx.session?.user) {
		throw new TRPCError({ code: "UNAUTHORIZED" });
	}

	// Check if user has global admin role (superadmin)
	const userRole = (ctx.session.user as any)?.role;
	if (userRole !== "admin") {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Only superadmins can access this resource"
		});
	}

	const activeOrganizationId = ctx.session.session.activeOrganizationId;

	if (!activeOrganizationId) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "User does not have an active organization"
		});
	}

	// Get the organization details using Better Auth API
	const organizationResult = await auth.api.getFullOrganization({
		headers: ctx.headers,
		query: {
			organizationId: activeOrganizationId,
		},
	});

	if (!organizationResult) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Organization not found"
		});
	}

	return next({
		ctx: {
			...ctx,
			session: { ...ctx.session, user: ctx.session.user },
			organization: organizationResult,
		},
	});
});

/**
 * Protected procedure with superadmin access
 * 
 * Use this for procedures that require the user to be a superadmin (global admin role).
 * It guarantees `ctx.session.user` and `ctx.organization` are not null, and user has global admin role.
 */
export const protectedProcedureWithSuperadmin = t.procedure.use(enforceUserIsSuperadmin);
