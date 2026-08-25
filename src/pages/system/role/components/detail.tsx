import type { RoleItemType } from "#src/api/system/role";

import { BasicButton } from "#src/components/basic-button";
import { BasicDrawer } from "#src/components/basic-drawer";

import { TeamOutlined } from "@ant-design/icons";
import { Alert, Descriptions, Flex, Tag, Typography } from "antd";
import { useTranslation } from "react-i18next";

interface DetailProps {
	onClose: () => void
	onOpenMembers: (role: RoleItemType) => void
	open: boolean
	role?: RoleItemType
}

export function Detail({ onClose, onOpenMembers, open, role }: DetailProps) {
	const { t } = useTranslation();
	return (
		<BasicDrawer onClose={onClose} open={open} title={t("system.role.roleDetail")} width={560}>
			{role && (
				<Flex gap="large" vertical>
					<Descriptions bordered column={1} size="small">
						<Descriptions.Item label={t("system.role.name")}>{role.name}</Descriptions.Item>
						<Descriptions.Item label={t("system.role.key")}><Typography.Text copyable>{role.key}</Typography.Text></Descriptions.Item>
						<Descriptions.Item label={t("system.role.type")}>{role.is_system ? <Tag>{t("system.role.builtIn")}</Tag> : t("system.role.custom")}</Descriptions.Item>
						<Descriptions.Item label={t("system.role.memberCount")}>{role.user_count}</Descriptions.Item>
						<Descriptions.Item label={t("common.remark")}>{role.remark || "-"}</Descriptions.Item>
						<Descriptions.Item label={t("common.createdAt")}>{role.created_at}</Descriptions.Item>
					</Descriptions>
					<div>
						<Typography.Text type="secondary">{t("system.role.permissionSummary")}</Typography.Text>
						<Flex className="mt-2" gap={6} wrap>
							{role.permission_codes.map(code => <Tag key={code}>{code}</Tag>)}
						</Flex>
					</div>
					<Alert
						action={<BasicButton icon={<TeamOutlined />} size="small" onClick={() => onOpenMembers(role)}>{t("system.role.manageMembers")}</BasicButton>}
						description={t("system.role.memberGuide")}
						showIcon
						type="info"
					/>
				</Flex>
			)}
		</BasicDrawer>
	);
}
