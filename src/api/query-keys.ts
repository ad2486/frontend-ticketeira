// Keys are hierarchical: invalidating `queryKeys.allEvents` also refreshes the
// list, the details and "my events" (TanStack matches keys by prefix).

export const queryKeys = {
	me: ["me"] as const,
	allEvents: ["events"] as const,
	events: (filters: { city?: string; state?: string } = {}) => ["events", "list", filters] as const,
	event: (id: string) => ["events", "detail", id] as const,
	myEvents: ["events", "mine"] as const,
	myTickets: ["tickets", "mine"] as const,
};
