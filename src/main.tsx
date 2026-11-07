import { createRoot } from "react-dom/client";
import App from "./app";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { StrictMode } from "react";
import { api } from "./api/client";
import { queryClient } from "./api/query-client";
import { authMiddleware } from "./auth/middleware";
import { refreshAccessToken } from "./auth/session";

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
