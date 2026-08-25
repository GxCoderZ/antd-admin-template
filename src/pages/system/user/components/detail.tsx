import type { UserItemType } from "#src/api/system/user";

import { BasicDrawer } from "#src/components/basic-drawer";

import { Badge, Descriptions } from "antd";
import { useTranslation } from "react-i18next";

interface DetailProps {
	onClose: () => void
	open: boolean
	user?: UserItemType
}

export function Detail({ onClose, open, user }: DetailProps) {
	const { t } = useTranslation();
	const status = user?.status === 1
		? { badge: "success" as const, text: t("system.user.status.active") }
		: user?.status === 2
			? { badge: "warning" as const, text: t("system.user.status.locked") }
			: { badge: "default" as const, text: t("system.user.status.disabled") };

	return (
		<BasicDrawer onClose={onClose} open={open} title={t("system.user.userDetail")} width={520}>
			{user && (
				<Descriptions bordered column={1} size="small">
					<Descriptions.Item label={t("system.user.username")}>{user.username}</Descriptions.Item>
					<Descriptions.Item label={t("system.user.displayName")}>{user.display_name}</Descriptions.Item>
					<Descriptions.Item label={t("system.user.email")}>{user.email}</Descriptions.Item>
					<Descriptions.Item label={t("common.status")}><Badge status={status.badge} text={status.text} /></Descriptions.Item>
					<Descriptions.Item label={t("system.user.id")}>{user.uuid}</Descriptions.Item>
					<Descriptions.Item label={t("common.createdAt")}>{user.created_at}</Descriptions.Item>
				</Descriptions>
			)}
		</BasicDrawer>
	);
}
