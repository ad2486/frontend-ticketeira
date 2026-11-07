import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";
import { z } from "zod/v4";
import { api } from "@/api/client";
import { errorMessage } from "@/api/errors";
import { unwrap } from "@/api/unwrap";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { brazilStates } from "@/lib/brazil-states";

// Mirrors the backend's createUserBody, so most errors show before calling the API.
const registerSchema = z.object({
	name: z.string().trim().min(1, "Name is required"),
	email: z.email("Invalid email"),
	cpf: z.string().regex(/^\d{11}$/, "CPF must have 11 digits, numbers only"),
	city: z.string().trim().min(1, "City is required"),
	state: z.enum(brazilStates, "Select a state"),
	birthDate: z.iso
		.date("Invalid date")
		.refine((value) => new Date(value) <= new Date(), "Birth date can't be in the future"),
	password: z.string().min(8, "Password must have at least 8 characters").max(128),
});

type RegisterForm = z.infer<typeof registerSchema>;

export function RegisterPage() {
	const navigate = useNavigate();
	const { register, handleSubmit, formState } = useForm<RegisterForm>({
		resolver: zodResolver(registerSchema),
	});
	const signUp = useMutation({
		mutationFn: (data: RegisterForm) => unwrap(api.POST("/users/", { body: data })),
		// The backend doesn't log in on sign-up, so send the user to the login page.
		onSuccess: () => navigate("/login", { state: { registered: true } }),
	});
	const { errors } = formState;

	return (
		<div className="max-w-md mx-auto px-4 py-10">
			<Card>
				<CardHeader>
					<CardTitle>Create account</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col gap-4">
					<form
						onSubmit={handleSubmit((data) => signUp.mutate(data))}
						className="flex flex-col gap-4"
					>
						<FormField
							id="name"
							label="Name"
							registration={register("name")}
							error={errors.name?.message}
						/>
						<FormField
							id="email"
							label="Email"
							type="email"
							registration={register("email")}
							error={errors.email?.message}
						/>
						<FormField
							id="cpf"
							label="CPF"
							inputMode="numeric"
							placeholder="Numbers only"
							registration={register("cpf")}
							error={errors.cpf?.message}
						/>
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

						<FormField
							id="birthDate"
							label="Birth date"
							type="date"
							registration={register("birthDate")}
							error={errors.birthDate?.message}
						/>
						<FormField
							id="password"
							label="Password"
							type="password"
							autoComplete="new-password"
							registration={register("password")}
							error={errors.password?.message}
						/>

						{signUp.error && (
							<p className="text-sm text-destructive">{errorMessage(signUp.error)}</p>
						)}
						<Button type="submit" className="w-full" disabled={signUp.isPending}>
							Create account
						</Button>
					</form>
					<p className="text-sm text-muted-foreground">
						Already have an account?{" "}
						<Link to="/login" className="text-primary underline-offset-4 hover:underline">
							Log in
						</Link>
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
