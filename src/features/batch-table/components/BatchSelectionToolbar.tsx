import {
	CheckCircleOutlined,
	DeleteOutlined,
	ExportOutlined,
	StopOutlined,
} from "@ant-design/icons";
import { Button, Flex, Space, theme, Typography } from "antd";
import { useTranslation } from "react-i18next";

import type { BatchTableRecordStatus } from "#src/api/batch-table";

const { Text } = Typography;

interface BatchSelectionToolbarProps {
	disabled: boolean;
	exportLoading: boolean;
	onClear: () => void;
	onDelete: () => void;
	onExport: () => void;
	onStatusChange: (status: BatchTableRecordStatus) => void;
	selectedCount: number;
	statusLoading: boolean;
	deleteLoading: boolean;
}

export function BatchSelectionToolbar({
	deleteLoading,
	disabled,
	exportLoading,
	onClear,
	onDelete,
	onExport,
	onStatusChange,
	selectedCount,
	statusLoading,
}: BatchSelectionToolbarProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();

	return (
		<Flex align="center" gap={token.marginSM} justify="space-between" wrap>
			<Space size={token.marginSM} wrap>
				<Text strong>
					{t("adminShell.batchTable.selectedCount", { count: selectedCount })}
				</Text>
				<Button disabled={disabled} onClick={onClear} type="link">
					{t("adminShell.batchTable.clearSelection")}
				</Button>
			</Space>
			<Space size={token.marginSM} wrap>
				<Button
					disabled={disabled}
					icon={<CheckCircleOutlined aria-hidden />}
					loading={statusLoading}
					onClick={() => onStatusChange("active")}
				>
					{t("adminShell.batchTable.enableSelected")}
				</Button>
				<Button
					disabled={disabled}
					icon={<StopOutlined aria-hidden />}
					loading={statusLoading}
					onClick={() => onStatusChange("disabled")}
				>
					{t("adminShell.batchTable.disableSelected")}
				</Button>
				<Button
					disabled={disabled}
					icon={<ExportOutlined aria-hidden />}
					loading={exportLoading}
					onClick={onExport}
				>
					{t("adminShell.batchTable.exportSelected")}
				</Button>
				<Button
					danger
					disabled={disabled}
					icon={<DeleteOutlined aria-hidden />}
					loading={deleteLoading}
					onClick={onDelete}
				>
					{t("adminShell.batchTable.deleteSelected")}
				</Button>
			</Space>
		</Flex>
	);
}
