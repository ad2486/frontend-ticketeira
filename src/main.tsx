import { createRoot } from "react-dom/client";
import App from "./app";
import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { StrictMode } from "react";
import { api } from "./api/client";
import { authMiddleware } from "./auth/middleware";
import { refreshAccessToken } from "./auth/session";

const queryClient = new QueryClient();
const root = document.getElementById("root");
if (!root) throw new Error("Element #root not found");

api.use(authMiddleware);
await refreshAccessToken();

createRoot(root).render(
	<StrictMode>
		<QueryClientProvider client={queryClient}>
			<App />
			<ReactQueryDevtools />
		</QueryClientProvider>
	</StrictMode>,
);
