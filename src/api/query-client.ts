import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "./errors";

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			// Retrying only helps with network/server errors; a 4xx (404, 401...) won't change.
			retry: (failureCount, error) =>
				!(error instanceof ApiError && error.status < 500) && failureCount < 3,
		},
	},
});
