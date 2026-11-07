import { createBrowserRouter, RouterProvider } from "react-router";
import { RequireAuth } from "./auth/require-auth";
import { RootLayout } from "./components/layout";
import { EventsPage } from "./pages/events-page";
import { LoginPage } from "./pages/login-page";
import { NotFoundPage } from "./pages/not-found-page";
import { MyTicketsPage } from "./pages/tickets-page";

const router = createBrowserRouter([
	{
		path: "/",
		element: <RootLayout />,
		children: [
			{ index: true, element: <EventsPage /> },
			{ path: "*", element: <NotFoundPage /> },
			{ path: "login", element: <LoginPage /> },
			{
				element: <RequireAuth />,
				children: [{ path: "tickets", element: <MyTicketsPage /> }],
			},
		],
	},
]);

export default function App() {
	return <RouterProvider router={router} />;
}
