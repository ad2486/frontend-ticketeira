import { ApiError } from "./errors";

// Returns the response body on success, or throws ApiError on a non-2xx response.
// `data?: T` (not a union) so T is inferred from the success body without `undefined`.
export async function unwrap<T>(
	request: Promise<{ data?: T; error?: unknown; response: Response }>,
): Promise<T> {
	const { data, error, response } = await request;
	if (error !== undefined) {
		throw ApiError.fromResponse(response.status, error);
	}
	return data as T;
}
