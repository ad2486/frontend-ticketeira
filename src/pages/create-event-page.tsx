import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { z } from "zod/v4";
import { api } from "@/api/client";
import { errorMessage } from "@/api/errors";
import { queryKeys } from "@/api/query-keys";
import { unwrap } from "@/api/unwrap";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { brazilStates } from "@/lib/brazil-states";
import { saoPauloLocalToIso } from "@/lib/format";

// Validates what the organizer types (date in São Paulo time, price in reais);
// the conversion to the API format happens on submit.
const createEventSchema = z.object({
	title: z.string().trim().min(1, "Title is required"),
	description: z.string().trim(),
	location: z.string().trim().min(1, "Location is required"),
	city: z.string().trim().min(1, "City is required"),
	state: z.enum(brazilStates, "Select a state"),
	startsAt: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Date and time are required")
		.refine(
			(local) => new Date(saoPauloLocalToIso(local)) > new Date(),
			"The event must start in the future",
		),
	capacity: z.number("Capacity is required").int("Must be a whole number").min(1, "At least 1"),
	minAge: z
		.number("Minimum age is required")
		.int("Must be a whole number")
		.min(0, "Can't be negative"),
	price: z.number("Price is required").min(0, "Can't be negative"),
});

type CreateEventForm = z.infer<typeof createEventSchema>;

export function CreateEventPage() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { register, handleSubmit, formState } = useForm<CreateEventForm>({
		resolver: zodResolver(createEventSchema),
		defaultValues: { minAge: 0, price: 0 },
	});
	const createEvent = useMutation({
		mutationFn: (form: CreateEventForm) =>
			unwrap(
				api.POST("/events/", {
					body: {
						title: form.title,
						description: form.description || undefined,
						location: form.location,
						city: form.city,
						state: form.state,
						startsAt: saoPauloLocalToIso(form.startsAt),
						capacity: form.capacity,
						minAge: form.minAge,
						// Math.round avoids float drift (19.99 * 100 = 1998.9999...).
						ticketPriceCents: Math.round(form.price * 100),
					},
				}),
			),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.allEvents });
			navigate("/my-events");
		},
	});
	const { errors } = formState;

	return (
		<div className="max-w-md mx-auto px-4 py-10">
			<Card>
				<CardHeader>
					<CardTitle>Create event</CardTitle>
				</CardHeader>
				<CardContent>
					<form
						onSubmit={handleSubmit((form) => createEvent.mutate(form))}
						className="flex flex-col gap-4"
					>
						<FormField
							id="title"
							label="Title"
							registration={register("title")}
							error={errors.title?.message}
						/>

						<div className="flex flex-col gap-2">
							<Label htmlFor="description">Description (optional)</Label>
							<textarea
								id="description"
								rows={3}
								className="w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
								{...register("description")}
							/>
						</div>

						<FormField
							id="location"
							label="Location"
							placeholder="Venue name"
							registration={register("location")}
							error={errors.location?.message}
						/>

						<div className="grid gap-4 sm:grid-cols-2">
							<FormField
								id="city"
								label="City"
								registration={register("city")}
								error={errors.city?.message}
							/>

							<div className="flex flex-col gap-2">
								<Label htmlFor="state">State</Label>
								<select
									id="state"
									defaultValue=""
									aria-invalid={errors.state ? true : undefined}
									className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm"
									{...register("state")}
								>
									<option value="" disabled>
										Select...
									</option>
									{brazilStates.map((uf) => (
										<option key={uf} value={uf}>
											{uf}
										</option>
									))}
								</select>
								{errors.state && <p className="text-sm text-destructive">{errors.state.message}</p>}
							</div>
						</div>

						<FormField
							id="startsAt"
							label="Starts at (São Paulo time)"
							type="datetime-local"
							registration={register("startsAt")}
							error={errors.startsAt?.message}
						/>

						<div className="grid gap-4 sm:grid-cols-2">
							<FormField
								id="capacity"
								label="Capacity"
								type="number"
								min={1}
								step={1}
								registration={register("capacity", { valueAsNumber: true })}
								error={errors.capacity?.message}
							/>
							<FormField
								id="minAge"
								label="Minimum age"
								type="number"
								min={0}
								step={1}
								registration={register("minAge", { valueAsNumber: true })}
								error={errors.minAge?.message}
							/>
						</div>

						<FormField
							id="price"
							label="Ticket price (R$)"
							type="number"
							min={0}
							step={0.01}
							registration={register("price", { valueAsNumber: true })}
							error={errors.price?.message}
						/>

						{createEvent.error && (
							<p className="text-sm text-destructive">{errorMessage(createEvent.error)}</p>
						)}
						<Button type="submit" className="w-full" disabled={createEvent.isPending}>
							Create event
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
