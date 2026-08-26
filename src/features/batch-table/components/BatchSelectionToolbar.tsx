import {
	CheckCircleOutlined,
	DeleteOutlined,
	ExportOutlined,
	StopOutlined,
} from "@ant-design/icons";
import { Button, Flex, Space, theme, Typography } from "antd";
import { useTranslation } from "react-i18next";

import type { BatchTableStatusMutation } from "#src/api/batch-table";

const { Text } = Typography;

interface BatchSelectionSummaryProps {
	onClear: () => void;
	selectedCount: number;
}

interface BatchBulkActionBarProps {
	disabled: boolean;
	exportLoading: boolean;
	onDelete: () => void;
	onExport: () => void;
	onStatusChange: (status: BatchTableStatusMutation) => void;
	selectedCallCount: number;
	selectedCount: number;
	statusLoading: boolean;
	deleteLoading: boolean;
}

export function BatchSelectionSummary({
	onClear,
	selectedCount,
}: BatchSelectionSummaryProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();

	if (selectedCount === 0) {
		return (
			<Text type="secondary">
				{t("adminShell.batchTable.selectedCount", { count: selectedCount })}
			</Text>
		);
	}

	return (
		<Flex
			align="center"
			gap={token.marginSM}
			justify="space-between"
			style={{
				background: token.colorInfoBg,
				borderRadius: token.borderRadius,
				paddingBlock: token.paddingSM,
				paddingInline: token.padding,
			}}
			wrap
		>
			<Space size={token.marginSM} wrap>
				<Text strong>
					{t("adminShell.batchTable.selectedCount", { count: selectedCount })}
				</Text>
			</Space>
			<Button onClick={onClear} type="link">
				{t("adminShell.batchTable.clearSelection")}
			</Button>
		</Flex>
	);
}

export function BatchBulkActionBar({
	deleteLoading,
	disabled,
	exportLoading,
	onDelete,
	onExport,
	onStatusChange,
	selectedCallCount,
	selectedCount,
	statusLoading,
}: BatchBulkActionBarProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();

	if (selectedCount === 0) {
		return null;
	}

	return (
		<Flex
			align="center"
			data-testid="batch-table-bulk-action-bar"
			gap={token.marginSM}
			justify="space-between"
			style={{
				backdropFilter: "blur(8px)",
				background: `color-mix(in srgb, ${token.colorBgContainer} 88%, transparent)`,
				borderTop: `${token.lineWidth}px ${token.lineType} ${token.colorBorderSecondary}`,
				boxShadow: token.boxShadowTertiary,
				bottom: 0,
				left: "var(--admin-shell-fixed-left-offset, 0px)",
				paddingBlock: token.paddingSM,
				paddingInline: token.paddingLG,
				position: "fixed",
				right: 0,
				WebkitBackdropFilter: "blur(8px)",
				zIndex: token.zIndexPopupBase + 1,
			}}
			wrap
		>
			<Space size={token.marginSM} wrap>
				<Text strong>
					{t("adminShell.batchTable.selectedCount", { count: selectedCount })}
				</Text>
				<Text type="secondary">
					{t("adminShell.batchTable.selectedCallCount", {
						count: selectedCallCount,
					})}
				</Text>
			</Space>
			<Space size={token.marginSM} wrap>
				<Button
					disabled={disabled}
					icon={<CheckCircleOutlined aria-hidden />}
					loading={statusLoading}
					onClick={() => onStatusChange("online")}
				>
					{t("adminShell.batchTable.enableSelected")}
				</Button>
				<Button
					disabled={disabled}
					icon={<StopOutlined aria-hidden />}
					loading={statusLoading}
					onClick={() => onStatusChange("closed")}
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
