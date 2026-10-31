import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";

export function EventsPage() {
	const { data, isPending, error } = useQuery({
		queryKey: ["events"],
		queryFn: async () => {
			const { data, error } = await api.GET("/events/");
			if (error) throw error;
			return data;
		},
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
