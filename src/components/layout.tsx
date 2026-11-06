import { useQuery } from "@tanstack/react-query";
import { Link, Outlet } from "react-router";
import { api } from "@/api/client";
import { ApiError } from "@/api/errors";
import { useIsLoggedIn } from "@/auth/use-is-logged-in";

export function RootLayout() {
	const isLoggedIn = useIsLoggedIn();

	const me = useQuery({
		queryKey: ["me"],
		enabled: isLoggedIn,
		retry: false,
		queryFn: async () => {
			const { data, error, response } = await api.GET("/users/me");
			if (error) throw new ApiError(response.status);
			return data;
		},
	});
	return (
		<div className="min-h-screen flex flex-col bg-background text-foreground">
			<header className="border-b border-border">
				<div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
					<Link to="/">Ticketeira</Link>
					{isLoggedIn ? <span>{me.data?.name}</span> : <Link to="/login">Log in</Link>}
				</div>
			</header>
			<main className="flex-1">
				<Outlet />
			</main>
		</div>
	);
}
