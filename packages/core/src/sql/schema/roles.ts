import { pgEnum } from "drizzle-orm/pg-core";

export const roles = ["member", "admin", "owner", "viewer"] as const;
export const role = pgEnum("role", roles);
export type Role = (typeof roles)[number];

