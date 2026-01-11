import { pgEnum } from "drizzle-orm/pg-core";

const tenantTypeOptions = ["company", "individual"] as const;
export const tenantTypeEnum = pgEnum("tenantType", tenantTypeOptions);
export type TenantType = (typeof tenantTypeOptions)[number];
