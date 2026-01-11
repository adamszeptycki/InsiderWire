import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements } from 'better-auth/plugins/organization/access'

const statement = {
    ...defaultStatements,
    project: ["read","create", "share", "update", "delete"],
    invitation: ["read","create", "update", "delete", "cancel", "accept", "reject"],
    member: ["read","create", "update", "delete"],
} as const;

const ac = createAccessControl(statement);

const member = ac.newRole({
    project: ["read","create"],
    invitation: [ "read", "accept", "reject"],
});

const admin = ac.newRole({
    ...adminAc.statements, 
    project: ["read","create", "update"],
    invitation: ["read","create", "update", "delete", "cancel"],
    member: ["read","create", "update"]
});

const owner = ac.newRole({
    project: ["read","create", "update", "delete"],
    invitation: ["read","create", "update", "delete", "cancel"],
    member: ["read","create", "update", "delete"],
});

const viewer = ac.newRole({ 
    project: ["read"],
    invitation: [ "read", "accept", "reject"],
}); 
export { ac, admin, member, owner, statement, viewer };