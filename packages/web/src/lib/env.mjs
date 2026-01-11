import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";
import "dotenv/config";

export const env = createEnv({
	server: {
		NODE_ENV: z
			.enum(["development", "test", "production"])
			.default("development"),
	},
	client: {
		// NEXT_PUBLIC_PUBLISHABLE_KEY: z.string().min(1),
		NEXT_PUBLIC_PDF_VIEWER_LICENSE_KEY: z.string().optional(),
	},
	// If you're using Next.js < 13.4.4, you'll need to specify the runtimeEnv manually
	// runtimeEnv: {

	//   NEXT_PUBLIC_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_PUBLISHABLE_KEY,
	// },
	// For Next.js >= 13.4.4, you only need to destructure client variables:
	experimental__runtimeEnv: {
		// NEXT_PUBLIC_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_PUBLISHABLE_KEY,
		NEXT_PUBLIC_PDF_VIEWER_LICENSE_KEY: 'eyJkYXRhIjoiZXlKMElqb2liM0puWVc1cGVtRjBhVzl1SWl3aVlYWjFJam94TnpnM05EUXpNVGs1TENKa2JTSTZJbXh2WTJGc2FHOXpkRG96TURBd0lpd2liaUk2SWpNNE9USTNOak0yTW1FelpqYzVPVFFpTENKbGVIQWlPakUzTnpFNE1EUTNPVGtzSW1SdGRDSTZJbk53WldOcFptbGpJbjA9Iiwic2lnbmF0dXJlIjoiSHBUdlVnMlZNd0lwQnJieFFBczdXL0N1enBoSTl2MVlpZFNyNEc5K2VQYmt0TmkrNHhOV1gvaThJUk0wTzF3dE1sTkZERTVDNUlxVW1uSndHc1VBOFFXQkI3dkhWUlMyRjAydVZLbnE0OGd6TFZXUUQxMWdiamtScTVZZXFoZHhGL0FyT0RZZGtES09UYzdWRU16anB4bmlvWXNrMFQwOERzRElLck5YZFU0elg5Zm9JTUtqbDdnZ2l1KzJsaWQ4UzRpQWZYNkpBQ3B4UkdsNUZtZ1dVSTNDS3N0SzR6bFc0c0ZZOUMrN3pjNm02ZDRxdlFuejhHRGhxQWwvL2FBc2ZZcStxOUI3MVh6dU9zWmE1MnZUMUh3SDRJTFZOZXl3bHRiTCtZVm1tdTVRVnd0ZEw5Rzd4ZGlWWXliRFVpdUIzRmhsY3VEUENneGFLVWszazFjekpBPT0ifQ=='//process.env.NEXT_PUBLIC_PDF_VIEWER_LICENSE_KEY,
	},
});
