import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router";
import { api } from "@/api/client";
import { errorMessage } from "@/api/errors";
import { queryKeys } from "@/api/query-keys";
import { unwrap } from "@/api/unwrap";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/format";

const statusBadge = {
	draft: { label: "Draft", variant: "outline" },
	published: { label: "Published", variant: "default" },
	canceled: { label: "Canceled", variant: "destructive" },
	finished: { label: "Finished", variant: "secondary" },
} as const;

export function MyEventsPage() {
	const queryClient = useQueryClient();
	const events = useQuery({
		queryKey: queryKeys.myEvents,
		queryFn: () => unwrap(api.GET("/events/mine")),
	});

	// Publishing/canceling changes "my events", the public listing and the details.
	const refresh = () => queryClient.invalidateQueries({ queryKey: queryKeys.allEvents });

	const publish = useMutation({
		mutationFn: (id: string) =>
			unwrap(api.POST("/events/{id}/publish", { params: { path: { id } } })),
		onSuccess: refresh,
	});
	const cancel = useMutation({
		mutationFn: (id: string) =>
			unwrap(api.POST("/events/{id}/cancel", { params: { path: { id } } })),
		onSuccess: refresh,
	});

	const actionError = publish.error ?? cancel.error;

	return (
		<div className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-6">
			<div className="flex items-center justify-between gap-4">
				<h1 className="text-3xl font-bold">My events</h1>
				<Button asChild>
					<Link to="/events/new">Create event</Link>
				</Button>
			</div>

			{events.isPending && (
				<div className="flex flex-col gap-3">
					<Skeleton className="h-16" />
					<Skeleton className="h-16" />
					<Skeleton className="h-16" />
				</div>
			)}
			{events.error && <p className="text-sm text-destructive">{errorMessage(events.error)}</p>}
			{events.data?.length === 0 && (
				<div className="flex flex-col items-start gap-3 rounded-lg border border-border p-6">
					<p className="text-muted-foreground">You haven't created any events yet.</p>
					<Button asChild>
						<Link to="/events/new">Create event</Link>
					</Button>
				</div>
			)}
			{actionError && <p className="text-sm text-destructive">{errorMessage(actionError)}</p>}

			{events.data && events.data.length > 0 && (
				<ul className="rounded-lg border border-border divide-y divide-border">
					{events.data.map((event) => {
						// The backend only allows publishing/canceling events that haven't started.
						const isUpcoming = new Date(event.startsAt) > new Date();
						const canPublish = event.status === "draft" && isUpcoming;
						const canCancel =
							(event.status === "draft" || event.status === "published") && isUpcoming;
						const isBusy =
							(publish.isPending && publish.variables === event.id) ||
							(cancel.isPending && cancel.variables === event.id);
						const badge = statusBadge[event.status];

						return (
							<li
								key={event.id}
								className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
							>
								<div className="flex flex-col gap-1">
									<h2 className="font-semibold">{event.title}</h2>
									<p className="text-sm text-muted-foreground">
										{formatDateTime(event.startsAt)} · {event.soldTickets}/{event.capacity} sold
									</p>
								</div>
								<div className="flex flex-wrap items-center gap-2">
									<Badge variant={badge.variant}>{badge.label}</Badge>
									{canPublish && (
										<Button size="sm" disabled={isBusy} onClick={() => publish.mutate(event.id)}>
											Publish
										</Button>
									)}
									{canCancel && (
										<Button
											size="sm"
											variant="outline"
											disabled={isBusy}
											onClick={() => {
												if (window.confirm("Cancel this event? This can't be undone.")) {
													cancel.mutate(event.id);
												}
											}}
										>
											Cancel event
										</Button>
									)}
								</div>
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
}
