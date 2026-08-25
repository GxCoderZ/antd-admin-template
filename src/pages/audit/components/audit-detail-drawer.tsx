import type { AuditItemType } from "#src/api/audit";

import { BasicDrawer } from "#src/components/basic-drawer";

import { Badge, Descriptions } from "antd";
import { useTranslation } from "react-i18next";

interface AuditDetailDrawerProps {
	onClose: () => void
	open: boolean
	record?: AuditItemType
}

export function AuditDetailDrawer({ onClose, open, record }: AuditDetailDrawerProps) {
	const { t } = useTranslation();
	return (
		<BasicDrawer onClose={onClose} open={open} title={t("audit.detailTitle")} width={560}>
			{record && (
				<Descriptions bordered column={1} size="small">
					<Descriptions.Item label={t("audit.operator")}>{record.operator}</Descriptions.Item>
					<Descriptions.Item label={t("audit.action")}>{record.action}</Descriptions.Item>
					<Descriptions.Item label={t("audit.target")}>{record.target}</Descriptions.Item>
					<Descriptions.Item label={t("audit.result")}><Badge status={record.result === "success" ? "success" : "error"} text={record.result === "success" ? t("audit.success") : t("audit.failed")} /></Descriptions.Item>
					<Descriptions.Item label={t("audit.ipAddress")}>{record.ip}</Descriptions.Item>
					<Descriptions.Item label={t("audit.occurredAt")}>{record.created_at}</Descriptions.Item>
				</Descriptions>
			)}
		</BasicDrawer>
	);
}
