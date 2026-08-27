import { FooterToolbar } from "@ant-design/pro-components";
import { Button, Space, Typography } from "antd";
import type { ReactNode } from "react";

const { Text } = Typography;

interface ManagementBatchToolbarProps {
	actions: ReactNode;
	clearText: string;
	extra?: ReactNode;
	onClear: () => void;
	selectedCount: number;
	selectedText: ReactNode;
	testId: string;
}

export function ManagementBatchToolbar({
	actions,
	clearText,
	extra,
	onClear,
	selectedCount,
	selectedText,
	testId,
}: ManagementBatchToolbarProps) {
	if (selectedCount === 0) {
		return null;
	}

	return (
		<div data-admin-shell-footer-bar="true">
			<FooterToolbar
				data-testid={testId}
				extra={
					<Space size="middle">
						<Text>{selectedText}</Text>
						{extra}
						<Button onClick={onClear} type="link">
							{clearText}
						</Button>
					</Space>
				}
				portalDom={false}
				style={{
					overflowX: "auto",
					whiteSpace: "nowrap",
					width: "calc(100% - var(--admin-shell-fixed-left-offset, 0px))",
				}}
			>
				<Space size="middle">
					{actions}
				</Space>
			</FooterToolbar>
		</div>
	);
}
