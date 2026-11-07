import { useQuery } from "@tanstack/react-query";
import { Link, Outlet, useNavigate } from "react-router";
import { api } from "@/api/client";
import { ApiError } from "@/api/errors";
import { logout } from "@/auth/session";
import { useIsLoggedIn } from "@/auth/use-is-logged-in";
import { Button } from "./ui/button";

export function RootLayout() {
	const isLoggedIn = useIsLoggedIn();
	const navigate = useNavigate();

	const handleLogout = async () => {
		await logout();
		navigate("/");
	};

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
					{isLoggedIn ? (
						<div className="flex items-center gap-4">
							<span>{me.data?.name}</span>
							<Button variant="ghost" onClick={handleLogout}>
								Log out
							</Button>
						</div>
					) : (
						<Link to="/login">Log in</Link>
					)}
				</div>
			</header>
			<main className="flex-1">
				<Outlet />
			</main>
		</div>
	);
}
