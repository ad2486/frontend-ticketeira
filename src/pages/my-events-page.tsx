import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router";
import { api } from "@/api/client";
import { errorMessage } from "@/api/errors";
import { queryKeys } from "@/api/query-keys";
import { unwrap } from "@/api/unwrap";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";

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
		<div className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold">My events</h1>
				<Link to="/events/new" className="underline">
					Create event
				</Link>
			</div>

			{events.isPending && <p>Loading...</p>}
			{events.error && <p className="text-destructive">{errorMessage(events.error)}</p>}
			{events.data?.length === 0 && <p>You haven't created any events yet.</p>}
			{actionError && <p className="text-destructive">{errorMessage(actionError)}</p>}

			<ul className="flex flex-col gap-4">
				{events.data?.map((event) => {
					// The backend only allows publishing/canceling events that haven't started.
					const isUpcoming = new Date(event.startsAt) > new Date();
					const canPublish = event.status === "draft" && isUpcoming;
					const canCancel =
						(event.status === "draft" || event.status === "published") && isUpcoming;
					const isBusy =
						(publish.isPending && publish.variables === event.id) ||
						(cancel.isPending && cancel.variables === event.id);

					return (
						<li key={event.id} className="rounded-lg border border-border p-4 flex flex-col gap-2">
							<div className="flex items-center justify-between gap-4">
								<h2 className="text-lg font-semibold">{event.title}</h2>
								<span className="rounded-md border px-2 py-0.5 text-sm">{event.status}</span>
							</div>
							<p className="text-sm text-muted-foreground">
								{formatDateTime(event.startsAt)} · {event.soldTickets}/{event.capacity} sold
							</p>
							<div className="flex gap-2">
								{canPublish && (
									<Button disabled={isBusy} onClick={() => publish.mutate(event.id)}>
										Publish
									</Button>
								)}
								{canCancel && (
									<Button
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
		</div>
	);
}
