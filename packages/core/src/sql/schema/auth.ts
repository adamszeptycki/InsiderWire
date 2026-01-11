import { defaultFields, timestamps } from "@starter/core/src/sql/utils";
import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { role, roles } from "./roles";

export const users = pgTable("user", {
	...defaultFields,
	name: text("name"),
	email: text("email").notNull().unique(),
	emailVerified: boolean("email_verified").notNull().default(false),
	image: text("image"),
	role: text("role").default("user"),
});

export const BaseUserSchema = createSelectSchema(users);
export const InsertUserSchema = createInsertSchema(users).omit({
	id: true,
});
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const accounts = pgTable("account", {
	...defaultFields,
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: uuid("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at"),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
	scope: text("scope"),
	password: text("password"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull(),
});

export const sessions = pgTable("session", {
	...defaultFields,
	expiresAt: timestamp("expires_at").notNull(),
	token: text("token").notNull().unique(),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
		() => new Date(),
	),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: uuid("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	impersonatedBy: text("impersonated_by"),
	activeOrganizationId: uuid("active_organization_id").references(() => organizations.id, {
		onDelete: "set null",
	}),
});

export const verifications = pgTable("verification", {
	id: uuid("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: timestamp("expires_at").notNull(),
	createdAt: timestamp("created_at"),
	updatedAt: timestamp("updated_at"),
});

// Schema for users - used to validate API requests
const baseSchema = createSelectSchema(users).omit(timestamps);

export const insertUserParams = baseSchema.extend({}).omit({
	id: true,
});

export const updateUserSchema = baseSchema.omit({
	id: true,
});
export const updateUserParams = baseSchema.extend({});
export const userIdSchema = baseSchema.pick({ id: true });

export const organizations = pgTable("organizations", {
	...defaultFields,
	domain: text("domain"),
	type: text("type"),
	name: text("name").notNull(),
	slug: text("slug").unique(),
	logo: text("logo"),
	isPlaceholder: boolean("is_placeholder").notNull().default(true),
});

export type Organization = typeof organizations.$inferSelect;

export const members = pgTable("members", {
	...defaultFields,
	organizationId: uuid("organization_id")
		.notNull()
		.references(() => organizations.id, { onDelete: "cascade" }),
	userId: uuid("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	role: role("role").default("member").notNull(),
	createdAt: timestamp("created_at").notNull(),
});

export type Member = typeof members.$inferSelect;

export const invitations = pgTable("invitations", {
	...defaultFields,
	organizationId: uuid("organization_id")
		.notNull()
		.references(() => organizations.id, { onDelete: "cascade" }),
	email: text("email").notNull(),
	role: text("role"),
	status: text("status").default("pending").notNull(),
	expiresAt: timestamp("expires_at").notNull(),
	inviterId: uuid("inviter_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
});
