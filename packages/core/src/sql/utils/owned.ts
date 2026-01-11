import { organizations, users } from "@starter/core/src/sql/schema/auth";
import { type AnyPgColumn, uuid } from "drizzle-orm/pg-core";

const defaultOwnerFields = {
    ownerId: uuid("owner_id").notNull().references((): AnyPgColumn => users.id, { onDelete: "set null" }),
};
const defaultOwnerFieldsWithNull = {
    ownerId: uuid("owner_id").references((): AnyPgColumn => users.id, { onDelete: "set null" }),
};


const orgOwnerFields = {
    organizationId: uuid("organization_id").references(
		():AnyPgColumn => organizations.id,
		{ onDelete: "set null" },
	).notNull(),
}
const orgOwnerFieldsWithNull = {
    organizationId: uuid("organization_id").references(
		():AnyPgColumn => organizations.id,
		{ onDelete: "set null" },
	),
}

const assignedToFields = {
    assignedToId: uuid("assigned_to_id").references(() => users.id, { onDelete: "set null" }),
}

export { defaultOwnerFields, orgOwnerFields, assignedToFields,  defaultOwnerFieldsWithNull, orgOwnerFieldsWithNull};
