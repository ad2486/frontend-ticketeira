import { useQuery } from "@tanstack/react-query";
import { Link, Outlet, useNavigate } from "react-router";
import { api } from "@/api/client";
import { queryKeys } from "@/api/query-keys";
import { unwrap } from "@/api/unwrap";
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
		queryKey: queryKeys.me,
		enabled: isLoggedIn,
		retry: false,
		queryFn: () => unwrap(api.GET("/users/me")),
	});
	return (
		<div className="min-h-screen flex flex-col bg-background text-foreground">
			<header className="border-b border-border">
				<div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
					<Link to="/">Ticketeira</Link>
					{isLoggedIn ? (
						<div className="flex items-center gap-4">
							<Link to="/tickets">My tickets</Link>
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
