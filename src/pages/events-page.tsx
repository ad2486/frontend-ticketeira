import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import { queryKeys } from "@/api/query-keys";
import { unwrap } from "@/api/unwrap";

export function EventsPage() {
	const { data, isPending, error } = useQuery({
		queryKey: queryKeys.events(),
		queryFn: () => unwrap(api.GET("/events/")),
	});

	if (isPending) return <p>Loading...</p>;
	if (error) return <p>Error while loading events.</p>;
	if (data.length === 0) return <p>No events published.</p>;
	return (
		<ul>
			{data.map((event) => (
				<li key={event.id}>{event.title}</li>
			))}
		</ul>
	);
}
