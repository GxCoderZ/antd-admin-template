import { FooterToolbar } from "@ant-design/pro-components";
import { Button, Typography } from "antd";
import { useTranslation } from "react-i18next";

import type { BatchTableStatusMutation } from "#src/api/batch-table";

const { Text } = Typography;

interface BatchBulkActionBarProps {
	disabled: boolean;
	onDelete: () => void;
	onStatusChange: (status: BatchTableStatusMutation) => void;
	selectedCallCount: number;
	selectedCount: number;
	statusLoading: boolean;
	deleteLoading: boolean;
}

export function BatchBulkActionBar({
	deleteLoading,
	disabled,
	onDelete,
	onStatusChange,
	selectedCallCount,
	selectedCount,
	statusLoading,
}: BatchBulkActionBarProps) {
	const { t } = useTranslation();

	if (selectedCount === 0) {
		return null;
	}

	return (
		<FooterToolbar
			data-testid="batch-table-bulk-action-bar"
			extra={
				<div>
					<Text>
						{t("adminShell.batchTable.selectedCount", {
							count: selectedCount,
						})}
					</Text>
					&nbsp;&nbsp;
					<Text>
						{t("adminShell.batchTable.selectedCallCount", {
							count: selectedCallCount,
						})}
					</Text>
				</div>
			}
			portalDom={false}
			style={{
				width:
					"calc(100% - var(--admin-shell-fixed-left-offset, 0px))",
			}}
		>
			<Button
				danger
				disabled={disabled}
				loading={deleteLoading}
				onClick={onDelete}
			>
				{t("adminShell.batchTable.deleteSelected")}
			</Button>
			<Button
				disabled={disabled}
				loading={statusLoading}
				onClick={() => onStatusChange("online")}
				type="primary"
			>
				{t("adminShell.batchTable.approveSelected")}
			</Button>
		</FooterToolbar>
	);
}
