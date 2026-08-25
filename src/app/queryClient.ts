import { ApiProblemError } from "#src/api/client";
import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";

const DEFAULT_QUERY_STALE_TIME_MS = 5 * 60 * 1000;

interface AppQueryClientOptions {
	onUnauthorized?: () => void;
}

export function createAppQueryClient({
	onUnauthorized,
}: AppQueryClientOptions = {}) {
	const handleError = (error: unknown) => {
		if (error instanceof ApiProblemError && error.status === 401) {
			onUnauthorized?.();
		}
	};

	return new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
				staleTime: DEFAULT_QUERY_STALE_TIME_MS,
			},
		},
		mutationCache: new MutationCache({ onError: handleError }),
		queryCache: new QueryCache({ onError: handleError }),
	});
}
