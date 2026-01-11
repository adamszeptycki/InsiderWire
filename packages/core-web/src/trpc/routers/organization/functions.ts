import { auth } from "@starter/core-web/src/auth/auth";
import type { Context } from "@starter/core-web/src/trpc/context";
import type { Organization } from "@starter/core/src/sql/schema/auth";
import { updateOrganization as updateOrganizationMutation } from "@starter/core/src/sql/queries/organization/mutations";
import { TRPCError } from "@trpc/server";
import type { CreateTenantArgs } from "./schema";

type Role = "member" | "admin" | "owner" | "viewer";
type ProtectedContext = Context & {
	session: { user: NonNullable<Context['session']>['user'] }
};
type PublicContext = Context;

export async function setCurrentOrganization(
	ctx: ProtectedContext,
	input: { organizationId: string }
) {
	const data = await auth.api.setActiveOrganization({
		body: { organizationId: input.organizationId },
		headers: ctx.headers,
	});
	return data;
}

export async function listUserOrganizations(ctx: ProtectedContext) {
	const [orgsList, activeOrg] = await Promise.all([
		auth.api.listOrganizations({
			headers: ctx.headers,
		}),
		auth.api.getFullOrganization({
			headers: ctx.headers,
		}),
	]);
	return { orgsList, activeOrg };
}

export async function updateMemberRole(
	ctx: ProtectedContext,
	input: { memberId: string; role: Role },
) {
	const activeOrg = await auth.api.getFullOrganization({
		headers: ctx.headers,
	});
	if (!activeOrg) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "User does not have an active organization",
		});
	}
	const data = await auth.api.updateMemberRole({
		body: {
			memberId: input.memberId,
			role: input.role,
		},
		headers: ctx.headers,
	});
	return data;
}

export async function inviteMember(
	ctx: ProtectedContext,
	input: { email: string; role: Role },
) {
	const activeOrg = await auth.api.getFullOrganization({
		headers: ctx.headers,
	});
	if (!activeOrg) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "User does not have an active organization",
		});
	}
	const data = await auth.api.createInvitation({
		body: {
			email: input.email,
			role: input.role,
			organizationId: activeOrg.id,
			resend: true,
		},
		headers: ctx.headers,
	});
	return data;
}

export async function cancelInvitation(
	ctx: ProtectedContext,
	input: { invitationId: string }
) {
	return auth.api.cancelInvitation({
		body: { invitationId: input.invitationId },
		headers: ctx.headers,
	});
}

export async function acceptInvitation(
	ctx: ProtectedContext,
	input: { invitationId: string }
) {
	const result = await auth.api.acceptInvitation({
		body: { invitationId: input.invitationId },
		headers: ctx.headers,
	});
	return result;
}

export async function rejectInvitation(
	ctx: ProtectedContext,
	input: { invitationId: string }
) {
	return await auth.api.rejectInvitation({
		body: { invitationId: input.invitationId },
	});
}

export async function getInvitation(
	_ctx: PublicContext,
	input: { invitationId: string; email: string }
) {
	return null;
}

export async function listInvitations(
	ctx: ProtectedContext,
	input: { status?: "pending" | "accepted" | "rejected" | "cancelled" }
) {
	return [];
}

export async function listMembers(ctx: ProtectedContext, input: { search?: string|null }) {
	const activeOrg = await auth.api.getFullOrganization({
		headers: ctx.headers,
	});
	if (!activeOrg) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "User does not have an active organization",
		});
	}
	const membersList = (activeOrg as any).members ?? [];
	if (!input.search) return membersList;
	const term = input.search.toLowerCase();
	return membersList.filter((m: any) =>
		(m.user?.name ?? "").toLowerCase().includes(term) ||
		(m.user?.email ?? "").toLowerCase().includes(term),
	);
}

export async function checkDomainAvailability(
	_ctx: ProtectedContext,
	input: { domain: string }
) {
	const domain = input.domain.trim();
	if (domain === "" || domain.includes(".")) {
		return { isAvailable: false };
	}
	return { isAvailable: true };
}

export async function createEmptyOrGetCurrent(ctx: ProtectedContext, input: { tenantName: string }) {
	const activeOrg = await auth.api.getFullOrganization({
		headers: ctx.headers,
	});
	if (activeOrg) {
		return activeOrg;
	}

	const org = await auth.api.createOrganization({
		body: {
			name: input.tenantName,
			slug: input.tenantName.toLowerCase().replace(/\s+/g, "-"),
		},
		headers: ctx.headers,
	});
	if (!org || !org.id) {
		throw new TRPCError({
			code: "UNPROCESSABLE_CONTENT",
			message: "Organization creation failed",
		});
	}
	await auth.api.setActiveOrganization({
		body: { organizationId: org.id },
		headers: ctx.headers,
	});
	return org;
}

export async function createOrganization(
	ctx: ProtectedContext,
	input: CreateTenantArgs
) {
	const org = await auth.api.createOrganization({
		body: {
			name: input.name,
			slug: input.domain,
		},
		headers: ctx.headers,
	});

	const orgId = org?.id;
	if (!orgId) {
		throw new TRPCError({
			code: "UNPROCESSABLE_CONTENT",
			message: "Organization ID not found",
		});
	}
	return org as unknown as Organization;
}

export async function updateOrganization(input: Partial<CreateTenantArgs> & { id: string }) {
	return updateOrganizationMutation(input.id, {
		name: input.name,
		domain: input.domain,
		type: input.type,
		isPlaceholder: false,
	}) as unknown as Organization | null;
}
