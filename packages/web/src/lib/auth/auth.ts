import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "@starter/core-web/src/auth/auth";

export const getServerSession = cache(
	async () =>
		await auth.api.getSession({
			headers: await headers(),
		}),
);