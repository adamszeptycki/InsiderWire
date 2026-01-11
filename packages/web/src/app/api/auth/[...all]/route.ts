import { auth } from "@starter/core-web/src/auth/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { type NextRequest } from "next/server";
import { addCorsHeaders, createCorsOptionsResponse } from "@/lib/cors";

const { GET: authGet, POST: authPost } = toNextJsHandler(auth);

export async function OPTIONS(req: NextRequest) {
	const origin = req.headers.get("origin") || "";
	return createCorsOptionsResponse(origin);
}

export async function GET(req: NextRequest) {
	const origin = req.headers.get("origin") || "";
	const response = await authGet(req);
	return addCorsHeaders(response, origin);
}

export async function POST(req: NextRequest) {
	const origin = req.headers.get("origin") || "";
	const response = await authPost(req);
	return addCorsHeaders(response, origin);
}