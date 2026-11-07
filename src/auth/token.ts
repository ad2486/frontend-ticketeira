let accessToken: string | null = null;

type Listener = () => void;

const listeners = new Set<Listener>();

export const subscribeToToken = (listener: Listener) => {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
};

const notify = () => {
	for (const listener of listeners) listener();
};

export const getAccessToken = () => accessToken;

export const setAccessToken = (token: string) => {
	accessToken = token;
	notify();
};
export const clearAccessToken = () => {
	accessToken = null;
	notify();
};
