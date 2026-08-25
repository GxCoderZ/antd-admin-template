import { SettingOutlined } from "@ant-design/icons";
import { Button, Checkbox, Flex, Popover, theme, Tooltip } from "antd";
import type { ReactNode } from "react";

interface TableColumnOption {
	key: string;
	label: ReactNode;
}

interface TableColumnSettingsProps {
	ariaLabel: string;
	columns: readonly TableColumnOption[];
	defaultVisibleKeys: readonly string[];
	onChange: (keys: string[]) => void;
	requiredKeys: readonly string[];
	resetLabel: string;
	selectAllLabel: string;
	visibleKeys: readonly string[];
}

export function TableColumnSettings({
	ariaLabel,
	columns,
	defaultVisibleKeys,
	onChange,
	requiredKeys,
	resetLabel,
	selectAllLabel,
	visibleKeys,
}: TableColumnSettingsProps) {
	const { token } = theme.useToken();
	const allKeys = columns.map((column) => column.key);
	const requiredKeySet = new Set(requiredKeys);
	const optionalKeys = allKeys.filter((key) => !requiredKeySet.has(key));
	const requiredKeysInOrder = allKeys.filter((key) => requiredKeySet.has(key));
	const optionalVisibleCount = optionalKeys.filter((key) =>
		visibleKeys.includes(key),
	).length;
	const settings = (
		<Flex
			gap={token.marginXS}
			style={{ minWidth: token.controlHeight * 6 }}
			vertical
		>
			<Flex align="center" justify="space-between">
				<Checkbox
					checked={optionalVisibleCount === optionalKeys.length}
					indeterminate={
						optionalVisibleCount > 0 &&
						optionalVisibleCount < optionalKeys.length
					}
					onChange={(event) =>
						onChange(event.target.checked ? allKeys : requiredKeysInOrder)
					}
				>
					{selectAllLabel}
				</Checkbox>
				<Button
					onClick={() => onChange([...defaultVisibleKeys])}
					size="small"
					type="link"
				>
					{resetLabel}
				</Button>
			</Flex>
			<Checkbox.Group
				onChange={(keys) => {
					const selectedKeys = new Set([
						...keys.map(String),
						...requiredKeysInOrder,
					]);
					onChange(allKeys.filter((key) => selectedKeys.has(key)));
				}}
				value={[...visibleKeys]}
			>
				<Flex gap={token.marginXS} vertical>
					{columns.map((column) => (
						<Checkbox
							disabled={requiredKeySet.has(column.key)}
							key={column.key}
							value={column.key}
						>
							{column.label}
						</Checkbox>
					))}
				</Flex>
			</Checkbox.Group>
		</Flex>
	);

	return (
		<Popover
			arrow={false}
			content={settings}
			placement="bottomRight"
			trigger="click"
		>
			<Tooltip title={ariaLabel}>
				<Button
					aria-label={ariaLabel}
					color="default"
					icon={<SettingOutlined aria-hidden />}
					variant="link"
				/>
			</Tooltip>
		</Popover>
	);
}
