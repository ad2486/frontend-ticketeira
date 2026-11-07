import { Link } from "react-router";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
	return (
		<div className="max-w-6xl mx-auto px-4 py-16 flex flex-col items-start gap-4">
			<h1 className="font-display text-6xl font-extrabold uppercase leading-[0.9]">
				Page not found
			</h1>
			<p className="text-muted-foreground">This address doesn't match any page.</p>
			<Button asChild>
				<Link to="/">Browse events</Link>
			</Button>
		</div>
	);
}
