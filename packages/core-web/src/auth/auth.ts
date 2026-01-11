import { getDb } from "@starter/core/src/sql";
	import {
		accounts,
		invitations,
		members,
		organizations,
		sessions,
		users,
		verifications,
	} from "@starter/core/src/sql/schema";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { organization, jwt } from "better-auth/plugins";
import { admin as adminPlugin } from "better-auth/plugins"
import { sendOrganizationInvitation } from "./invitation/email";
import { ac, admin, member, owner, viewer } from "./organization";

// https://github.com/patelharsh9797/t3_stack_better_auth/blob/main/src/server/auth/index.ts
export const auth = betterAuth({
	emailAndPassword: {
		enabled: true,
	},
	advanced: {
		database: {
			generateId: false,
			// useNumberId: false,
		},
		cookiePrefix: "kensaku",
		// becuase we need api for Electron APP
		defaultCookieAttributes: {
			sameSite: "none", 
			secure: true,
			partitioned: true,
		}
	},
	user: {
		fields: {
			email: "email",
		},
		additionalFields: {
			isPremium: {
				type: "boolean",
				required: false,
				input: false,
			},
			role: {
				type: "string",
				required: false,
				input: false,
			},
		},
		create: {
			additionalFields: {
				isPremium: false,
				role: "user",
				name: "",
			},
		},
	},
	database: drizzleAdapter(getDb(), {
		provider: "pg",
		usePlural: true,
		schema: {
			users,
			accounts,
			sessions,
			verifications,
			members,
			organizations,
			invitations,
		},
	}),
	rateLimit: {
		window: 60, // time window in seconds
		max: 5, // max requests in the window
	},
	plugins: [
		nextCookies(),
		adminPlugin(),
		organization({
			async sendInvitationEmail(data: any) {
				const baseUrl = process.env.BETTER_AUTH_URL || "https://last10.ai"
				await sendOrganizationInvitation({
					recipientEmail: data.email,
					organizationName: data.organization.name,
					inviterName: data.inviter.user.name,
					inviterEmail: data.inviter.user.email,
					role: data.role,
					invitationId: data.invitation.id,
					baseUrl,
				});
			},
			allowUserToCreateOrganization: true,
			ac,
			roles: {
				member,
				admin,
				owner,
				viewer,
			},
		})
	],
	trustedOrigins: [
		"http://localhost:*",
		"https://localhost:*",
		"http://localhost:3001",
		"http://localhost:3002",
		"http://localhost:3003",
		"https://lucidiant.ai",
		"https://last10.ai",
		"chrome-extension://ifnfopfpdoodpecnlmfjkciohkdblmig",
		"app://localhost",  // Electron app origin
		"file://",          // Electron file protocol
	],
 });



export type Session = typeof auth.$Infer.Session;
export type AuthUserType = Session["user"];
