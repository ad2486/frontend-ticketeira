import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { api } from "@/api/client";
import { errorMessage } from "@/api/errors";
import { queryKeys } from "@/api/query-keys";
import { unwrap } from "@/api/unwrap";
import { formatDateTime } from "@/lib/format";

export function MyTicketsPage() {
	const { data, isPending, error } = useQuery({
		queryKey: queryKeys.myTickets,
		queryFn: () => unwrap(api.GET("/tickets/mine")),
	});

	return (
		<div className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-6">
			<h1 className="text-2xl font-bold">My tickets</h1>

			{isPending && <p>Loading...</p>}
			{error && <p className="text-destructive">{errorMessage(error)}</p>}
			{data?.length === 0 && (
				<p>
					You have no tickets yet.{" "}
					<Link to="/" className="underline">
						Browse events
					</Link>
				</p>
			)}

			<ul className="flex flex-col gap-4">
				{data?.map((ticket) => {
					const { event } = ticket;
					const isCanceled = event.status === "canceled";
					// Past events stay listed, just dimmed.
					const isPast = new Date(event.startsAt) < new Date();

					return (
						<li
							key={ticket.id}
							className={`rounded-lg border border-border p-4 flex flex-col gap-2 ${isPast || isCanceled ? "opacity-60" : ""}`}
						>
							<div className="flex items-center justify-between gap-4">
								<h2 className="text-lg font-semibold">{event.title}</h2>
								{isCanceled && (
									<span className="rounded-md bg-destructive/10 px-2 py-0.5 text-sm text-destructive">
										Event canceled
									</span>
								)}
							</div>
							<p className="text-sm text-muted-foreground">
								{formatDateTime(event.startsAt)} · {event.location}, {event.city}/{event.state}
							</p>
							<p className="text-sm">
								Ticket code: <code className="font-mono font-semibold">{ticket.uniqueCode}</code>
							</p>
						</li>
					);
				})}
			</ul>
		</div>
	);
}
