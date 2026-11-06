import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { z } from "zod/v4";
import { api } from "@/api/client";
import { ApiError } from "@/api/errors";
import { setAccessToken } from "@/auth/token";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const loginSchema = z.object({
	email: z.email("Invalid email"),
	password: z.string().min(1, "Password is required").max(128),
});

type LoginForm = z.infer<typeof loginSchema>;

function loginErrorMessage(error: Error) {
	if (error instanceof ApiError && error.status === 401) return "Invalid email or password";
	if (error instanceof ApiError && error.status === 429)
		return "Too many attempts, try again in a minute";
	return "Something went wrong, try again";
}

export function LoginPage() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { register, handleSubmit, formState } = useForm<LoginForm>({
		resolver: zodResolver(loginSchema),
	});
	const login = useMutation({
		mutationFn: async (data: LoginForm) => {
			const { data: res, error, response } = await api.POST("/auth/login", { body: data });
			if (error) throw new ApiError(response.status);
			return res;
		},
		onSuccess: (res) => {
			setAccessToken(res.accessToken);
			queryClient.invalidateQueries({ queryKey: ["me"] });
			navigate("/");
		},
	});
	const onSubmit = (data: LoginForm) => login.mutate(data);
	return (
		<form onSubmit={handleSubmit(onSubmit)}>
			<Label htmlFor="email">Email</Label>
			<Input id="email" type="email" {...register("email")} />
			{formState.errors.email && <p>{formState.errors.email.message}</p>}

			<Label htmlFor="password">Password</Label>
			<Input id="password" type="password" {...register("password")} />
			{formState.errors.password && <p>{formState.errors.password.message}</p>}

			{login.error && <p>{loginErrorMessage(login.error)}</p>}
			<Button type="submit" disabled={login.isPending}>
				Log in
			</Button>
		</form>
	);
}
