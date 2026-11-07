import { createBrowserRouter, RouterProvider } from "react-router";
import { RequireAuth } from "./auth/require-auth";
import { RootLayout } from "./components/layout";
import { CreateEventPage } from "./pages/create-event-page";
import { EventDetailPage } from "./pages/event-detail-page";
import { EventsPage } from "./pages/events-page";
import { LoginPage } from "./pages/login-page";
import { MyEventsPage } from "./pages/my-events-page";
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
			{ path: "events/:id", element: <EventDetailPage /> },
			{
				element: <RequireAuth />,
				children: [
					{ path: "tickets", element: <MyTicketsPage /> },
					{ path: "my-events", element: <MyEventsPage /> },
					// Static segment: React Router prefers it over "events/:id".
					{ path: "events/new", element: <CreateEventPage /> },
				],
			},
			{ path: "*", element: <NotFoundPage /> },
		],
	},
]);

export default function App() {
	return <RouterProvider router={router} />;
}
