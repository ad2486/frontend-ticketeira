const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
	dateStyle: "medium",
	timeStyle: "short",
	timeZone: "America/Sao_Paulo",
});

const priceFormatter = new Intl.NumberFormat("en-US", {
	style: "currency",
	currency: "BRL",
});

// Formats a UTC ISO 8601 timestamp for display in São Paulo time.
export function formatDateTime(iso: string): string {
	return dateTimeFormatter.format(new Date(iso));
}

// Turns a <input type="datetime-local"> value ("2026-12-01T21:00") into an ISO string
// in São Paulo time. Decided: event times are always entered in São Paulo time, and
// Brazil has had no DST since 2019, so the offset is a fixed -03:00.
export function saoPauloLocalToIso(local: string): string {
	return `${local}:00-03:00`;
}

// Formats integer cents as BRL, showing "Free" for zero.
export function formatPrice(cents: number): string {
	if (cents === 0) {
		return "Free";
	}
	return priceFormatter.format(cents / 100);
}
