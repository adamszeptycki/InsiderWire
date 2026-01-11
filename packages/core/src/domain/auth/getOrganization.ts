import { getOrganizationById } from "/core/src/sql/queries/organization/queries"
import { getUserWithOrganizations } from "/core/src/sql/queries/user/queries"

const getOrganization = async (userId: string) => {
    const user = await getUserWithOrganizations(userId)
    if(!user) {
        throw new Error("User not found")
    }
    const primaryOrganization = user?.primaryOrganization
    if (primaryOrganization) {
        return primaryOrganization
    }
    // Return the first organization membership's organization if no primary organization exists, sorted by organization id
    const sortedMemberships = user.organizationMemberships.slice().sort((a, b) => {
        if (a.organization.id < b.organization.id) return -1;
        if (a.organization.id > b.organization.id) return 1;
        return 0;
    });
    return sortedMemberships[0]?.organization
}

/**
 * Optimized version of getOrganization that leverages session data when available
 * If organizationId is provided from session, it avoids redundant user queries
 */
const getOrganizationOptimized = async (userId: string, sessionOrganizationId?: string | null) => {
    // If we have organizationId from session, try to use it first
    if (sessionOrganizationId) {
        try {
            const organization = await getOrganizationById(sessionOrganizationId);
            if (organization) {
                return organization;
            }
        } catch (error) {
            console.warn(`Could not load organization ${sessionOrganizationId} from session, falling back to full resolution`);
        }
    }
    
    // Fallback to full organization resolution logic
    return await getOrganization(userId);
}

export { getOrganization, getOrganizationOptimized } 