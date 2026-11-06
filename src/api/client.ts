import type { Middleware } from "openapi-fetch";
import createClient from "openapi-fetch";
import { getAccessToken } from "@/auth/token";
import type { paths } from "./schema";

export const api = createClient<paths>({
	baseUrl: import.meta.env.VITE_API_URL,
	credentials: "include",
});

const authMiddleWare: Middleware = {
	onRequest({ request }) {
		const token = getAccessToken();
		if (token) request.headers.set("Authorization", `Bearer ${token}`);
		return request;
	},
};

api.use(authMiddleWare);
