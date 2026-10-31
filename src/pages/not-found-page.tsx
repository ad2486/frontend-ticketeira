import { Link } from "react-router";

export function NotFoundPage() {
	return (
		<div>
			<h1>404 - Page not found</h1>
			<Link to="/">Go back</Link>
		</div>
	);
}
