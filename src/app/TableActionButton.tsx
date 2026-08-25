import { DownOutlined } from "@ant-design/icons";
import { Button, type ButtonProps, Dropdown, type MenuProps } from "antd";
import type { ReactNode } from "react";

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

interface TableActionMenuProps {
	items: NonNullable<MenuProps["items"]>;
	label: ReactNode;
}

export function TableActionMenu({ items, label }: TableActionMenuProps) {
	return (
		<Dropdown menu={{ items }} placement="bottomRight" trigger={["click"]}>
			<TableActionButton
				icon={<DownOutlined aria-hidden />}
				iconPlacement="end"
			>
				{label}
			</TableActionButton>
		</Dropdown>
	);
}
