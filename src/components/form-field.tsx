import type * as React from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FormFieldProps = {
	id: string;
	label: string;
	registration: UseFormRegisterReturn;
	error?: string;
	type?: React.HTMLInputTypeAttribute;
} & Omit<React.ComponentProps<"input">, "id" | "type">;

export function FormField({
	id,
	label,
	registration,
	error,
	type = "text",
	...rest
}: FormFieldProps) {
	return (
		<div className="flex flex-col gap-2">
			<Label htmlFor={id}>{label}</Label>
			<Input
				id={id}
				type={type}
				aria-invalid={error ? true : undefined}
				{...rest}
				{...registration}
			/>
			{error && <p className="text-sm text-destructive">{error}</p>}
		</div>
	);
}
