import { Button, type ButtonProps } from "antd";

export function TableActionButton({ style, ...props }: ButtonProps) {
	return (
		<Button
			{...props}
			size="small"
			style={{ ...style, paddingInline: 0 }}
			type="link"
		/>
	);
}
