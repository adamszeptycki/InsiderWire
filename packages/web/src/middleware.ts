import { betterFetch } from "@better-fetch/fetch";
import type { Session } from "better-auth/types";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware to protect routes that require authentication
 * This runs before any route handler and can redirect unauthenticated users
 */
export default async function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// Public routes that don't require authentication
	const publicRoutes = ["/", "/auth/sign-in", "/auth/sign-up"];

	// API routes and static assets should pass through
	if (pathname.startsWith("/api/") || pathname.startsWith("/_next/")) {
		return NextResponse.next();
	}

	// Check if the current path is public
	const isPublicRoute = publicRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));

	// If it's a public route, allow access
	if (isPublicRoute) {
		return NextResponse.next();
	}

	// For protected routes (like /dashboard), verify the session
	try {
		const { data: session } = await betterFetch<Session>("/api/auth/get-session", {
			baseURL: request.nextUrl.origin,
			headers: {
				// Forward the cookie header to the auth endpoint
				cookie: request.headers.get("cookie") || "",
			},
		});

		// If no valid session, redirect to sign in
		if (!session) {
			const signInUrl = new URL("/auth/sign-in", request.url);
			signInUrl.searchParams.set("callbackUrl", pathname);
			return NextResponse.redirect(signInUrl);
		}

		// User is authenticated, allow access
		return NextResponse.next();
	} catch (error) {
		// If there's an error checking the session, redirect to sign in
		console.error("Error verifying session:", error);
		const signInUrl = new URL("/auth/sign-in", request.url);
		signInUrl.searchParams.set("callbackUrl", pathname);
		return NextResponse.redirect(signInUrl);
	}
}

export const config = {
	matcher: ["/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|$).*)"],
};
