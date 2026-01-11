import { type NextRequest, NextResponse } from "next/server";

/**
 * Check if the origin is a localhost origin
 * @param origin - The origin to check
 * @returns true if the origin is localhost, false otherwise
 */
export function isLocalhostOrigin(origin: string): boolean {
	return !!(
		origin.match(/^https?:\/\/localhost(:\d+)?$/) ||
		origin.match(/^https?:\/\/127\.0\.0\.1(:\d+)?$/) ||
		origin.match(/^https?:\/\/\[::1\](:\d+)?$/)
	);
}

/**
 * Add CORS headers to a response for localhost origins
 * @param response - The response to add headers to
 * @param origin - The origin to allow
 * @returns The response with CORS headers added if origin is localhost
 */
export function addCorsHeaders(response: Response, origin: string): Response {
	if (isLocalhostOrigin(origin)) {
		const newResponse = new Response(response.body, response);
		newResponse.headers.set("Access-Control-Allow-Origin", origin);
		newResponse.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
		newResponse.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, Cookie, trpc-accept");
		newResponse.headers.set("Access-Control-Allow-Credentials", "true");
		return newResponse;
	}
	return response;
}

/**
 * Create a CORS OPTIONS preflight response for localhost origins
 * @param origin - The origin to allow
 * @returns NextResponse with CORS headers if origin is localhost
 */
export function createCorsOptionsResponse(origin: string): NextResponse {
	const response = new NextResponse(null, { status: 200 });
	if (isLocalhostOrigin(origin)) {
		response.headers.set("Access-Control-Allow-Origin", origin);
		response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
		response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, Cookie, trpc-accept");
		response.headers.set("Access-Control-Allow-Credentials", "true");
	}
	return response;
}

