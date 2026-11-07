import { cn } from "cn";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, formatPrice } from "@/lib/format";

type Tone = "cobalt" | "paper";

// Same event id, same tone: the list and the event page agree.
export function posterTone(id: string): Tone {
	const sum = [...id].reduce((total, char) => total + char.charCodeAt(0), 0);
	return sum % 2 === 0 ? "cobalt" : "paper";
}

const toneClass: Record<Tone, string> = {
	cobalt: "bg-primary text-primary-foreground",
	paper: "bg-paper text-foreground",
};

const tiltClass = {
	left: "-rotate-[0.6deg]",
	right: "rotate-[0.6deg]",
	none: "",
};

interface EventPosterProps {
	title: string;
	startsAt: string;
	city: string;
	state: string;
	priceCents: number;
	soldOut: boolean;
	tone: Tone;
	tilt?: "left" | "right" | "none";
	size?: "card" | "hero";
	// The event page's poster is the page title, so it can be an h1.
	as?: "h1" | "h2";
}

export function EventPoster({
	title,
	startsAt,
	city,
	state,
	priceCents,
	soldOut,
	tone,
	tilt = "none",
	size = "card",
	as: Heading = "h2",
}: EventPosterProps) {
	return (
		<article
			className={cn(
				"flex flex-col justify-between gap-6 rounded-none p-6",
				toneClass[tone],
				tiltClass[tilt],
				size === "card" &&
					"min-h-64 transition-transform hover:rotate-0 motion-reduce:transition-none",
				size === "hero" && "min-h-72 w-full max-w-md",
			)}
		>
			<Heading
				className={cn(
					"break-words font-display uppercase font-extrabold leading-[0.9] tracking-tight",
					size === "hero" ? "text-6xl sm:text-7xl" : "text-4xl",
				)}
			>
				{title}
			</Heading>
			<div className="flex flex-col gap-2">
				<p className="text-sm font-medium">{formatDateTime(startsAt)}</p>
				<p className="text-sm">{`${city}/${state}`}</p>
				<div className="flex items-center justify-between gap-2">
					<p className="text-lg font-bold">{formatPrice(priceCents)}</p>
					{soldOut && <Badge variant={tone === "cobalt" ? "secondary" : "default"}>Sold out</Badge>}
				</div>
			</div>
		</article>
	);
}
