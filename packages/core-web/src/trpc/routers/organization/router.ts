import { roles } from "@starter/core/src/sql/schema";
import { protectedProcedure, protectedProcedureWithOptionalOrganization, publicProcedure, router } from "@starter/core-web/src/trpc/trpc";
import { z } from "zod";
import * as organizationFunctions from "./functions";
import { CreateTenantSchema } from "./schema";

export const organizationRouter = router({
	setCurrentOrganization: protectedProcedure.input(z.object({
		organizationId: z.string().uuid(),
	})).mutation(async ({ ctx, input }) => {
		return organizationFunctions.setCurrentOrganization(ctx, input);
	}),

	listUserOrganizations: protectedProcedure.query(async ({ ctx }) => {
		return organizationFunctions.listUserOrganizations(ctx);
	}),

	updateMemberRole: protectedProcedure.input(z.object({
		memberId: z.string().uuid(),
		role: z.enum(roles),
	})).mutation(async ({ ctx, input }) => {
		return organizationFunctions.updateMemberRole(ctx, input);
	}),
	inviteMember: protectedProcedure.input(z.object({
		email: z.string().email(),
		role: z.enum(roles),
	})).mutation(async ({ ctx, input }) => {
		return organizationFunctions.inviteMember(ctx, input);
	}),
	cancelInvitation: protectedProcedure.input(z.object({
		invitationId: z.string().uuid(),
	})).mutation(async ({ ctx, input }) => {
		return organizationFunctions.cancelInvitation(ctx, input);
	}),
	acceptInvitation: protectedProcedure.input(z.object({
		invitationId: z.string().uuid(),
	})).mutation(async ({ ctx, input }) => {
		return organizationFunctions.acceptInvitation(ctx, input);
	}),
	rejectInvitation: protectedProcedure.input(z.object({
		invitationId: z.string().uuid(),
	})).mutation(async ({ ctx, input }) => {
		return organizationFunctions.rejectInvitation(ctx, input);
	}),
	getInvitation: publicProcedure.input(z.object({
		invitationId: z.string().uuid(),
		email: z.string().email(),
	})).query(async ({ ctx, input }) => {
		return organizationFunctions.getInvitation(ctx, input);
	}),
	listInvitations: protectedProcedure.input(z.object({
		status: z.enum(["pending", "accepted", "rejected", "cancelled"]).optional(),
	})).query(async ({ ctx, input }) => {
		return organizationFunctions.listInvitations(ctx, input);
	}),
	listMembers: protectedProcedure.input(z.object({
		search: z.string().optional(),
	})).query(async ({ ctx, input }) => {
		return organizationFunctions.listMembers(ctx, input);
	}),
	checkDomainAvailability: protectedProcedure
		.input(
			z.object({
				domain: z.string(),
			}),
		)
		.query(async ({ ctx, input }) => {
			return organizationFunctions.checkDomainAvailability(ctx, input);
		}),
	createEmptyOrGetCurrent: protectedProcedure
	.input(z.object({
		tenantName: z.string().min(1),
	}))
	.mutation(async ({ ctx, input }) => {
		return organizationFunctions.createEmptyOrGetCurrent(ctx, input);
	}),
	create: protectedProcedure
		.input(CreateTenantSchema)
		.mutation(async ({ ctx, input }) => {
			return organizationFunctions.createOrganization(ctx, input);
		}),

	update: protectedProcedureWithOptionalOrganization
		.input(
			CreateTenantSchema.partial().extend({
				id: z.string().uuid().optional(),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const id = input.id || ctx.organization?.id;
			if (!id) {
				throw new Error("Organization not found");
			}
			return organizationFunctions.updateOrganization({...input, id});
		}),
});
