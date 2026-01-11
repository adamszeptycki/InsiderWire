import { adminClient, organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";


export const getAuthClient = (baseUrl: string) => createAuthClient({
	baseURL: baseUrl,
	plugins: [adminClient(), organizationClient()],
});
 