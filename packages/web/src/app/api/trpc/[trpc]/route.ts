import { createTRPCContext } from "@starter/core-web/src/trpc/context";
import { appRouter } from "@starter/core-web/src/trpc/routers/_app";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import type { NextRequest } from "next/server";
import { addCorsHeaders, createCorsOptionsResponse } from "@/lib/cors";
import { env } from "@/lib/env.mjs";

const createContext = async (req: NextRequest) => {
	return createTRPCContext({
		headers: req.headers,
	});
};

const handler = async (req: NextRequest) => {
	const result = await fetchRequestHandler({
		endpoint: "/api/trpc",
		req,
		router: appRouter,
		createContext: () => createContext(req),
		onError:
			env.NODE_ENV === "development"
				? ({
						path,
						error,
				  }: {
						path?: string;
						error: unknown;
				  }) => {
						const message =
							error && typeof error === "object" && "message" in error
								? (error as { message: string }).message
								: "Unknown error";
						console.error(`❌ tRPC failed on ${path ?? "<no-path>"}: ${message}`);
				  }
				: undefined,
	});
	return result;
};

export async function OPTIONS(req: NextRequest) {
	const origin = req.headers.get("origin") || "";
	return createCorsOptionsResponse(origin);
}

export async function GET(req: NextRequest) {
	const origin = req.headers.get("origin") || "";
	const response = await handler(req);
	return addCorsHeaders(response, origin);
}

export async function POST(req: NextRequest) {
	const origin = req.headers.get("origin") || "";
	const response = await handler(req);
	return addCorsHeaders(response, origin);
}
