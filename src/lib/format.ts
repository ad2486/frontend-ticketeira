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

// Formats integer cents as BRL, showing "Free" for zero.
export function formatPrice(cents: number): string {
	if (cents === 0) {
		return "Free";
	}
	return priceFormatter.format(cents / 100);
}
