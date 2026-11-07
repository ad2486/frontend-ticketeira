import { createBrowserRouter, RouterProvider } from "react-router";
import { RequireAuth } from "./auth/require-auth";
import { RootLayout } from "./components/layout";
import { EventsPage } from "./pages/events-page";
import { LoginPage } from "./pages/login-page";
import { NotFoundPage } from "./pages/not-found-page";
import { RegisterPage } from "./pages/register-page";
import { MyTicketsPage } from "./pages/tickets-page";

const router = createBrowserRouter([
	{
		path: "/",
		element: <RootLayout />,
		children: [
			{ index: true, element: <EventsPage /> },
			{ path: "login", element: <LoginPage /> },
			{ path: "register", element: <RegisterPage /> },
			{
				element: <RequireAuth />,
				children: [{ path: "tickets", element: <MyTicketsPage /> }],
			},
			{ path: "*", element: <NotFoundPage /> },
		],
	},
]);

export default function App() {
	return <RouterProvider router={router} />;
}
