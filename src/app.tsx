import { createBrowserRouter, RouterProvider } from "react-router";
import { RootLayout } from "./components/layout";
import { EventsPage } from "./pages/events-page";
import { NotFoundPage } from "./pages/not-found-page";

const router = createBrowserRouter([
	{
		path: "/",
		element: <RootLayout />,
		children: [
			{ index: true, element: <EventsPage /> },
			{ path: "*", element: <NotFoundPage /> },
		],
	},
]);

export default function App() {
	return <RouterProvider router={router} />;
}
