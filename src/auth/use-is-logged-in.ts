import { useSyncExternalStore } from "react";
import { getAccessToken, subscribeToToken } from "./token";

export function useIsLoggedIn() {
	const token = useSyncExternalStore(subscribeToToken, getAccessToken);
	return token !== null;
}
