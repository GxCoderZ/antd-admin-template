import type { LoginLogItemType } from "#src/api/login-log";

import { BasicDrawer } from "#src/components/basic-drawer";

import { Badge, Descriptions } from "antd";
import { useTranslation } from "react-i18next";

interface LoginLogDetailDrawerProps {
	onClose: () => void
	open: boolean
	record?: LoginLogItemType
}

export function LoginLogDetailDrawer({ onClose, open, record }: LoginLogDetailDrawerProps) {
	const { t } = useTranslation();
	return (
		<BasicDrawer onClose={onClose} open={open} title={t("login-log.detailTitle")} width={560}>
			{record && (
				<Descriptions bordered column={1} size="small">
					<Descriptions.Item label={t("login-log.recordId")}>{record.id}</Descriptions.Item>
					<Descriptions.Item label={t("login-log.identifier")}>{record.identifier}</Descriptions.Item>
					<Descriptions.Item label={t("login-log.result")}><Badge status={record.result === "success" ? "success" : "error"} text={record.result === "success" ? t("login-log.success") : t("login-log.failed")} /></Descriptions.Item>
					<Descriptions.Item label={t("login-log.ipAddress")}>{record.ip}</Descriptions.Item>
					<Descriptions.Item label={t("login-log.device")}>{record.device}</Descriptions.Item>
					<Descriptions.Item label={t("login-log.language")}>{record.language}</Descriptions.Item>
					<Descriptions.Item label={t("login-log.timeZone")}>{record.time_zone}</Descriptions.Item>
					<Descriptions.Item label={t("login-log.occurredAt")}>{record.created_at}</Descriptions.Item>
				</Descriptions>
			)}
		</BasicDrawer>
	);
}
