import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router";
import { z } from "zod/v4";
import { api } from "@/api/client";
import { errorMessage } from "@/api/errors";
import { queryKeys } from "@/api/query-keys";
import { unwrap } from "@/api/unwrap";
import { setAccessToken } from "@/auth/token";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";

const loginSchema = z.object({
	email: z.email("Invalid email"),
	password: z.string().min(1, "Password is required").max(128),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const location = useLocation();
	const state = location.state as { from?: string; registered?: boolean } | null;
	const from = state?.from ?? "/";
	const { register, handleSubmit, formState } = useForm<LoginForm>({
		resolver: zodResolver(loginSchema),
	});
	const login = useMutation({
		mutationFn: (data: LoginForm) => unwrap(api.POST("/auth/login", { body: data })),
		onSuccess: (res) => {
			setAccessToken(res.accessToken);
			queryClient.invalidateQueries({ queryKey: queryKeys.me });
			navigate(from, { replace: true });
		},
	});
	const onSubmit = (data: LoginForm) => login.mutate(data);
	return (
		<form onSubmit={handleSubmit(onSubmit)}>
			{state?.registered && <p className="text-sm">Account created, please log in.</p>}
			<FormField
				id="email"
				label="Email"
				type="email"
				registration={register("email")}
				error={formState.errors.email?.message}
			/>
			<FormField
				id="password"
				label="Password"
				type="password"
				registration={register("password")}
				error={formState.errors.password?.message}
			/>

			{login.error && <p>{errorMessage(login.error)}</p>}
			<Button type="submit" disabled={login.isPending}>
				Log in
			</Button>
			<p className="text-sm">
				No account yet?{" "}
				<Link to="/register" className="underline">
					Create one
				</Link>
			</p>
		</form>
	);
}
