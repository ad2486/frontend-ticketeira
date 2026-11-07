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
	`whitespace-nowrap ${isActive ? "font-medium text-primary" : "text-muted-foreground hover:text-foreground"}`;

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
			{/* Keyboard users can jump past the header; visible only when focused. */}
			<a
				href="#main"
				className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-10 focus:rounded-lg focus:bg-background focus:px-3 focus:py-2"
			>
				Skip to content
			</a>
			<header className="border-b border-border">
				{/* On phones the nav wraps to its own row instead of overflowing. */}
				<div className="max-w-6xl mx-auto px-4 py-3 min-h-16 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
					<Link
						to="/"
						translate="no"
						className="font-display text-2xl font-extrabold uppercase tracking-tight text-primary"
					>
						Ticketeira
					</Link>
					<nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
						{isLoggedIn ? (
							<>
								<NavLink to="/tickets" className={navLinkClass}>
									My tickets
								</NavLink>
								<NavLink to="/my-events" className={navLinkClass}>
									My events
								</NavLink>
								<span className="hidden md:inline text-muted-foreground">{me.data?.name}</span>
								{/* Phones use the button on "My events"; the header has no room. */}
								<Button asChild size="sm" className="hidden sm:inline-flex">
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
			<main id="main" className="flex-1">
				<Outlet />
			</main>
		</div>
	);
}
