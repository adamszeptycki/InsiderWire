"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
	httpBatchStreamLink,
	httpSubscriptionLink,
	loggerLink,
	splitLink,
} from "@trpc/client";
import type React from "react";
import { useState } from "react";
import SuperJSON from "superjson";
import { trpc } from "./client";
import { getTrpcUrl } from "./utils";

export default function TrpcProvider({
	children,
	trpcUrl,
}: {
	children: React.ReactNode;
	trpcUrl?: string;
}) {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						refetchOnWindowFocus: false,
					},
				},
			}),
	);
	const [trpcClient] = useState(() =>
		trpc.createClient({
			links: [
				loggerLink({
					enabled: (op) =>
						process.env.NODE_ENV === "development" ||
						(op.direction === "down" && op.result instanceof Error),
				}),
			splitLink({
				condition: (op) => op.type === "subscription",
				true: httpSubscriptionLink({
					url: trpcUrl || getTrpcUrl(),
					/**
					 * @see https://trpc.io/docs/v11/data-transformers
					 */
					transformer: SuperJSON,
					eventSourceOptions() {
						return {
							withCredentials: true,
						};
					},
				}),
				false: httpBatchStreamLink({
					url: trpcUrl || getTrpcUrl(),
					/**
					 * @see https://trpc.io/docs/v11/data-transformers
					 */
					transformer: SuperJSON,
					fetch(url, options) {
						return fetch(url, {
							...options,
							credentials: 'include',
						});
					},
				}),
			}),
			],
		}),
	);

	return (
		<trpc.Provider client={trpcClient} queryClient={queryClient}>
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		</trpc.Provider>
	);
}
