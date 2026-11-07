export class ApiError extends Error {
	status: number;

	constructor(status: number, message?: string) {
		super(message ?? `Request failed with status ${status}`);
		this.status = status;
	}

	// Backend error body is { statusCode, error, message }; only `message` is used.
	static fromResponse(status: number, body: unknown): ApiError {
		const message =
			typeof body === "object" &&
			body !== null &&
			"message" in body &&
			typeof body.message === "string"
				? body.message
				: undefined;
		return new ApiError(status, message);
	}
}

// Network errors (fetch rejects with TypeError) are not ApiError, so they get the fallback.
export function errorMessage(error: unknown, fallback = "Something went wrong, try again"): string {
	return error instanceof ApiError ? error.message : fallback;
}
