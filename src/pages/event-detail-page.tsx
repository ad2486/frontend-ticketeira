import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation, useParams } from "react-router";
import { api } from "@/api/client";
import { errorMessage } from "@/api/errors";
import { queryKeys } from "@/api/query-keys";
import { unwrap } from "@/api/unwrap";
import { useIsLoggedIn } from "@/auth/use-is-logged-in";
import { Button } from "@/components/ui/button";
import { formatDateTime, formatPrice } from "@/lib/format";

export function EventDetailPage() {
	// The route is "events/:id", so the id is always present here.
	const id = useParams().id ?? "";
	const location = useLocation();
	const isLoggedIn = useIsLoggedIn();
	const queryClient = useQueryClient();

	const event = useQuery({
		queryKey: queryKeys.event(id),
		queryFn: () => unwrap(api.GET("/events/{id}", { params: { path: { id } } })),
	});

	const buy = useMutation({
		mutationFn: () => unwrap(api.POST("/events/{id}/orders", { params: { path: { id } } })),
		onSuccess: () => {
			// Remaining seats changed, and the new ticket belongs in "My tickets".
			queryClient.invalidateQueries({ queryKey: queryKeys.event(id) });
			queryClient.invalidateQueries({ queryKey: queryKeys.myTickets });
		},
	});

	if (event.isPending) return <p>Loading...</p>;
	if (event.error) return <p>{errorMessage(event.error)}</p>;

	const { data } = event;
	const remaining = data.capacity - data.soldTickets;
	const soldOut = remaining <= 0;

	return (
		<div className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-4">
			<h1 className="text-2xl font-bold">{data.title}</h1>
			<p>
				{formatDateTime(data.startsAt)} · {data.location}, {data.city}/{data.state}
			</p>
			{data.description && <p>{data.description}</p>}
			<p>Price: {formatPrice(data.ticketPriceCents)}</p>
			{data.minAge > 0 && <p>Minimum age: {data.minAge}</p>}
			<p>{soldOut ? "Sold out" : `${remaining} tickets left`}</p>

			{buy.isSuccess ? (
				<p>
					Ticket purchased!{" "}
					<Link to="/tickets" className="underline">
						See my tickets
					</Link>
				</p>
			) : isLoggedIn ? (
				<Button onClick={() => buy.mutate()} disabled={soldOut || buy.isPending}>
					{soldOut ? "Sold out" : "Buy ticket"}
				</Button>
			) : (
				<Link to="/login" state={{ from: location.pathname }} className="underline">
					Log in to buy
				</Link>
			)}
			{buy.error && <p className="text-destructive">{errorMessage(buy.error)}</p>}
		</div>
	);
}
