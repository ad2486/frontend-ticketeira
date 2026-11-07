import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation, useParams } from "react-router";
import { api } from "@/api/client";
import { errorMessage } from "@/api/errors";
import { queryKeys } from "@/api/query-keys";
import { unwrap } from "@/api/unwrap";
import { useIsLoggedIn } from "@/auth/use-is-logged-in";
import { EventPoster, posterTone } from "@/components/event-poster";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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

	if (event.isPending) {
		return (
			<div className="max-w-6xl mx-auto px-4 py-8 grid gap-8 md:grid-cols-[minmax(0,1fr)_320px]">
				<p className="sr-only">Loading...</p>
				<Skeleton className="h-72 w-full max-w-md rounded-none" />
				<Skeleton className="h-64 w-full rounded-xl md:col-start-2 md:row-start-1 self-start" />
			</div>
		);
	}
	if (event.error) {
		return (
			<div className="max-w-6xl mx-auto px-4 py-8">
				<p className="text-muted-foreground">{errorMessage(event.error)}</p>
			</div>
		);
	}

	const { data } = event;
	const remaining = data.capacity - data.soldTickets;
	const soldOut = remaining <= 0;

	return (
		<div className="max-w-6xl mx-auto px-4 py-8 grid gap-8 md:grid-cols-[minmax(0,1fr)_320px]">
			<div className="flex flex-col gap-8">
				<EventPoster
					title={data.title}
					startsAt={data.startsAt}
					city={data.city}
					state={data.state}
					priceCents={data.ticketPriceCents}
					soldOut={soldOut}
					tone={posterTone(data.id)}
					tilt="none"
					size="hero"
					as="h1"
				/>
				{data.description && <p className="max-w-[65ch] leading-relaxed">{data.description}</p>}
				<dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
					<dt className="text-muted-foreground">Date and time</dt>
					<dd>{formatDateTime(data.startsAt)}</dd>
					<dt className="text-muted-foreground">Venue</dt>
					<dd>{data.location}</dd>
					<dt className="text-muted-foreground">City</dt>
					<dd>{`${data.city}/${data.state}`}</dd>
					{data.minAge > 0 && (
						<>
							<dt className="text-muted-foreground">Minimum age</dt>
							<dd>{data.minAge}</dd>
						</>
					)}
				</dl>
			</div>

			<Card className="self-start">
				<CardContent className="flex flex-col gap-4">
					<div>
						<p className="text-sm text-muted-foreground">Price</p>
						<p className="text-3xl font-bold">{formatPrice(data.ticketPriceCents)}</p>
					</div>
					<p className="text-muted-foreground">
						{soldOut ? "Sold out" : `${remaining} tickets left`}
					</p>

					{buy.isSuccess ? (
						<p>
							Ticket purchased!{" "}
							<Link to="/tickets" className="font-medium text-primary underline underline-offset-4">
								See my tickets
							</Link>
						</p>
					) : isLoggedIn ? (
						<Button
							className="w-full"
							onClick={() => buy.mutate()}
							disabled={soldOut || buy.isPending}
						>
							{soldOut ? "Sold out" : "Buy ticket"}
						</Button>
					) : (
						<Button asChild className="w-full">
							<Link to="/login" state={{ from: location.pathname }}>
								Log in to buy
							</Link>
						</Button>
					)}
					{buy.error && <p className="text-sm text-destructive">{errorMessage(buy.error)}</p>}
				</CardContent>
			</Card>
		</div>
	);
}
