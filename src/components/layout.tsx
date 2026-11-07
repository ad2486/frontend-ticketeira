import { useQuery } from "@tanstack/react-query";
import { Link, NavLink, Outlet, useNavigate } from "react-router";
import { api } from "@/api/client";
import { queryKeys } from "@/api/query-keys";
import { unwrap } from "@/api/unwrap";
import { logout } from "@/auth/session";
import { useIsLoggedIn } from "@/auth/use-is-logged-in";
import { Button } from "./ui/button";

// The current page's link is highlighted in the accent color.
const navLinkClass = ({ isActive }: { isActive: boolean }) =>
	isActive ? "font-medium text-primary" : "text-muted-foreground hover:text-foreground";

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
		<div className="min-h-[100dvh] flex flex-col bg-background text-foreground">
			<header className="border-b border-border">
				<div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
					<Link
						to="/"
						className="font-display text-2xl font-extrabold uppercase tracking-tight text-primary"
					>
						Ticketeira
					</Link>
					<nav className="flex items-center gap-4 text-sm">
						{isLoggedIn ? (
							<>
								<NavLink to="/tickets" className={navLinkClass}>
									My tickets
								</NavLink>
								<NavLink to="/my-events" className={navLinkClass}>
									My events
								</NavLink>
								<span className="hidden md:inline text-muted-foreground">{me.data?.name}</span>
								<Button asChild size="sm">
									<Link to="/events/new">Create event</Link>
								</Button>
								<Button variant="ghost" size="sm" onClick={handleLogout}>
									Log out
								</Button>
							</>
						) : (
							<>
								<NavLink to="/login" className={navLinkClass}>
									Log in
								</NavLink>
								<Button asChild size="sm">
									<Link to="/register">Create account</Link>
								</Button>
							</>
						)}
					</nav>
				</div>
			</header>
			<main className="flex-1">
				<Outlet />
			</main>
		</div>
	);
}
