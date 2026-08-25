import type { ButtonProps } from "antd";
import type { ReactNode } from "react";
import { cn } from "#src/utils/cn";
import { Button } from "antd";

export interface BasicButtonProps extends ButtonProps {
	children?: ReactNode
	usage?: "default" | "table-action" | "toolbar"
}

export function BasicButton(props: BasicButtonProps) {
	const {
		children,
		className,
		usage = "default",
		...antdButtonProps
	} = props;

	return (
		<Button
			type="primary"
			{...antdButtonProps}
			className={cn(
				className,
				usage === "table-action" && "h-auto px-0",
				usage === "toolbar" && "inline-flex items-center justify-center",
			)}
		>
			{children}
		</Button>
	);
}
