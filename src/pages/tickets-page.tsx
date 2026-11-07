import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { api } from "@/api/client";
import { errorMessage } from "@/api/errors";
import { queryKeys } from "@/api/query-keys";
import { unwrap } from "@/api/unwrap";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/format";

export function MyTicketsPage() {
	const { data, isPending, error } = useQuery({
		queryKey: queryKeys.myTickets,
		queryFn: () => unwrap(api.GET("/tickets/mine")),
	});

	return (
		<div className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-6">
			<h1 className="text-3xl font-bold">My tickets</h1>

			{isPending && (
				<div className="flex flex-col gap-5">
					<Skeleton className="h-32 rounded-none" />
					<Skeleton className="h-32 rounded-none" />
					<Skeleton className="h-32 rounded-none" />
				</div>
			)}
			{error && (
				<p role="alert" className="text-destructive">
					{errorMessage(error)}
				</p>
			)}
			{data?.length === 0 && (
				<div className="flex flex-col items-start gap-3">
					<p>You have no tickets yet.</p>
					<Button asChild>
						<Link to="/">Browse events</Link>
					</Button>
				</div>
			)}

			<ul className="flex flex-col gap-5">
				{data?.map((ticket) => {
					const { event } = ticket;
					const isCanceled = event.status === "canceled";
					// Past events stay listed, just dimmed.
					const isPast = new Date(event.startsAt) < new Date();

					return (
						<li
							key={ticket.id}
							className={`relative overflow-hidden flex flex-col sm:flex-row bg-paper text-foreground rounded-none ${isPast || isCanceled ? "opacity-60" : ""}`}
						>
							<div className="flex-1 flex flex-col gap-2 p-5">
								<div className="flex flex-wrap items-start gap-2">
									<h2 className="min-w-0 break-words font-display uppercase font-extrabold leading-[0.9] tracking-tight text-3xl">
										{event.title}
									</h2>
									{isCanceled && <Badge variant="destructive">Event canceled</Badge>}
									{isPast && <Badge variant="outline">Past event</Badge>}
								</div>
								<p className="text-sm">{formatDateTime(event.startsAt)}</p>
								<p className="text-sm text-muted-foreground">
									{event.location}, {event.city}/{event.state}
								</p>
							</div>

							<div className="flex flex-col gap-1 p-5 border-t-2 border-dashed border-border sm:w-56 sm:shrink-0 sm:border-t-0 sm:border-l-2">
								<p className="text-xs text-muted-foreground">Ticket code</p>
								<code className="font-mono font-semibold break-all">{ticket.uniqueCode}</code>
							</div>

							{/* Perforation notches, desktop only. */}
							<span
								aria-hidden="true"
								className="hidden sm:block absolute top-0 right-56 size-5 translate-x-1/2 -translate-y-1/2 rounded-full bg-background"
							/>
							<span
								aria-hidden="true"
								className="hidden sm:block absolute bottom-0 right-56 size-5 translate-x-1/2 translate-y-1/2 rounded-full bg-background"
							/>
						</li>
					);
				})}
			</ul>
		</div>
	);
}
