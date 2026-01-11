export const getTrpcUrl = () => {
	const base = (() => {
		if (typeof window !== "undefined") return window.location.origin;
		if (process.env.APP_URL) return process.env.APP_URL;
		if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
		return `http://localhost:${process.env.PORT ?? 3000}`;
	})();

	return `${base}/api/trpc`;
};
