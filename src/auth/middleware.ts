import type { Middleware } from "openapi-fetch";
import { refreshAccessToken } from "./session";
import { clearAccessToken, getAccessToken } from "./token";

const retryCopies = new Map<string, Request>();

export const authMiddleware: Middleware = {
	onRequest({ request, id }) {
		const token = getAccessToken();
		if (token) request.headers.set("Authorization", `Bearer ${token}`);
		retryCopies.set(id, request.clone());
		return request;
	},

	async onResponse({ response, id, schemaPath }) {
		const copy = retryCopies.get(id);
		retryCopies.delete(id);

		if (response.status !== 401 || schemaPath.startsWith("/auth/") || !copy) return;

		const renewed = await refreshAccessToken();
		if (!renewed) {
			clearAccessToken();
			return;
		}

		copy.headers.set("Authorization", `Bearer ${getAccessToken()}`);
		return fetch(copy);
	},
};
