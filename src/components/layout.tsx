import { Link, Outlet } from "react-router";

export function RootLayout() {
	return (
		<div className="min-h-screen flex flex-col bg-background text-foreground">
			<header className="border-b border-border">
				<div className="max-w-5xl mx-auto px-4 h-16">
					<Link to="/">Ticketeira</Link>
				</div>
			</header>
			<main className="flex-1">
				<Outlet />
			</main>
		</div>
	);
}
