import { api } from "@/api/client";
import { queryClient } from "@/api/query-client";
import { clearAccessToken, setAccessToken } from "./token";

let refreshing: Promise<boolean> | null = null;

export function refreshAccessToken() {
	refreshing ??= doRefresh().finally(() => {
		refreshing = null;
	});
	return refreshing;
}

async function doRefresh() {
	const { data, error } = await api.POST("/auth/refresh");
	if (error) return false;
	setAccessToken(data.accessToken);
	return true;
}

export async function logout() {
	try {
		await api.POST("/auth/logout");
	} finally {
		clearAccessToken();
		queryClient.clear();
	}
}
