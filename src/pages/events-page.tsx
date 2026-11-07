import { useQuery } from "@tanstack/react-query";
import type { ReactNode, SubmitEvent } from "react";
import { Link, useSearchParams } from "react-router";
import { api } from "@/api/client";
import { errorMessage } from "@/api/errors";
import { queryKeys } from "@/api/query-keys";
import { unwrap } from "@/api/unwrap";
import { EventPoster, posterTone } from "@/components/event-poster";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { brazilStates } from "@/lib/brazil-states";

type State = (typeof brazilStates)[number];

function isState(value: string): value is State {
	return (brazilStates as readonly string[]).includes(value);
}

export function EventsPage() {
	const [searchParams, setSearchParams] = useSearchParams();
	const city = searchParams.get("city")?.trim() ?? "";
	const state = searchParams.get("state") ?? "";
	const validState = isState(state) ? state : undefined;

	// Only defined values go to the query key and the API.
	const filters: { city?: string; state?: State } = {};
	if (city) filters.city = city;
	if (validState) filters.state = validState;
	const hasFilters = Object.keys(filters).length > 0;

	const { data, isPending, error } = useQuery({
		queryKey: queryKeys.events(filters),
		queryFn: () => unwrap(api.GET("/events/", { params: { query: filters } })),
	});

	function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
		event.preventDefault();
		const form = new FormData(event.currentTarget);
		const nextParams = new URLSearchParams();
		const nextCity = String(form.get("city") ?? "").trim();
		const nextState = String(form.get("state") ?? "");
		if (nextCity) nextParams.set("city", nextCity);
		if (isState(nextState)) nextParams.set("state", nextState);
		setSearchParams(nextParams);
	}

	let results: ReactNode;
	if (isPending) {
		results = (
			<>
				<p className="sr-only">Loading…</p>
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
					{[1, 2, 3, 4, 5, 6].map((n) => (
						<Skeleton key={n} className="h-64 rounded-none" />
					))}
				</div>
			</>
		);
	} else if (error) {
		results = <p className="text-muted-foreground">{errorMessage(error)}</p>;
	} else if (data.length === 0) {
		results = (
			<p className="text-muted-foreground">
				{hasFilters ? "No events match these filters." : "No events published."}
			</p>
		);
	} else {
		results = (
			<ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
				{data.map((event, index) => (
					<li key={event.id}>
						<Link
							to={`/events/${event.id}`}
							className="block focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-4"
						>
							<EventPoster
								title={event.title}
								startsAt={event.startsAt}
								city={event.city}
								state={event.state}
								priceCents={event.ticketPriceCents}
								soldOut={event.soldTickets >= event.capacity}
								tone={posterTone(event.id)}
								tilt={index % 2 === 0 ? "left" : "right"}
							/>
						</Link>
					</li>
				))}
			</ul>
		);
	}

	return (
		<div className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-8">
			<h1 className="text-3xl font-bold">Events</h1>
			{/* defaultValue is read only on mount, so remount the form when the URL filters change. */}
			<form
				key={searchParams.toString()}
				onSubmit={handleSubmit}
				className="flex flex-col gap-4 md:flex-row md:items-end"
			>
				<div className="flex flex-col gap-1.5 md:w-64">
					<Label htmlFor="city">City</Label>
					<Input id="city" name="city" defaultValue={city} />
				</div>
				<div className="flex flex-col gap-1.5 md:w-40">
					<Label htmlFor="state">State</Label>
					<select
						id="state"
						name="state"
						defaultValue={validState ?? ""}
						className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
					>
						<option value="">All states</option>
						{brazilStates.map((uf) => (
							<option key={uf} value={uf}>
								{uf}
							</option>
						))}
					</select>
				</div>
				<Button type="submit">Filter</Button>
				{hasFilters && (
					<Button variant="link" asChild className="md:ml-auto">
						<Link to="/">Clear filters</Link>
					</Button>
				)}
			</form>
			{results}
		</div>
	);
}
