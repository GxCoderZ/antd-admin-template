import type { RoleItemType } from "#src/api/system/role";
import type { ProColumns } from "@ant-design/pro-components";
import type { TFunction } from "i18next";

import { BasicButton } from "#src/components/basic-button";

import { LockOutlined } from "@ant-design/icons";
import { Badge, Flex, Tag, Tooltip } from "antd";

interface RoleColumnPermissions {
	delete: boolean
	edit: boolean
	permissions: boolean
}

interface CreateRoleColumnsOptions {
	onConfigure: (role: RoleItemType) => void
	onDelete: (role: RoleItemType) => void
	onRename: (role: RoleItemType) => void
	onView: (role: RoleItemType) => void
	permissions: RoleColumnPermissions
	t: TFunction
}

export const permissionModuleNames: Record<string, string> = {
	"dashboard": "工作台",
	"audit": "审计日志",
	"login-log": "登录日志",
	"system:user": "用户管理",
	"system:role": "角色管理",
	"system:permission": "权限管理",
	"system:settings": "平台设置",
	"system:info": "系统信息",
};

export function createRoleColumns({ onConfigure, onDelete, onRename, onView, permissions, t }: CreateRoleColumnsOptions): ProColumns<RoleItemType>[] {
	return [
		{
			title: t("system.role.name"),
			dataIndex: "name",
			width: 170,
			ellipsis: true,
			sorter: true,
			render: (_, role) => <BasicButton type="link" usage="table-action" onClick={() => onView(role)}>{role.name}</BasicButton>,
		},
		{
			title: t("system.role.key"),
			dataIndex: "key",
			width: 180,
			copyable: true,
			ellipsis: true,
			hideInSearch: true,
		},
		{
			title: t("system.role.memberCount"),
			dataIndex: "user_count",
			width: 120,
			hideInSearch: true,
			sorter: true,
		},
		{
			title: t("system.role.permissionSummary"),
			dataIndex: "permission_codes",
			width: 280,
			hideInSearch: true,
			render: (_, role) => (
				<Flex gap={4} wrap>
					{role.permission_codes.slice(0, 3).map(code => <Tag key={code}>{code}</Tag>)}
					{role.permission_codes.length > 3 && (
						<Tag>
							+
							{role.permission_codes.length - 3}
						</Tag>
					)}
				</Flex>
			),
		},
		{
			title: t("common.status"),
			dataIndex: "status",
			valueType: "select",
			valueEnum: { 1: { text: t("common.enabled") }, 2: { text: t("common.disabled") } },
			width: 100,
			sorter: true,
			render: (_, role) => <Badge status={role.status === 1 ? "success" : "default"} text={role.status === 1 ? t("common.enabled") : t("common.disabled")} />,
		},
		{
			title: t("common.createdAt"),
			dataIndex: "created_at",
			width: 180,
			hideInSearch: true,
			sorter: true,
		},
		{
			title: t("common.action"),
			valueType: "option",
			key: "option",
			width: 230,
			fixed: "right",
			render: (_, role) => (
				<Flex align="center" gap={4}>
					{permissions.edit && <BasicButton type="link" usage="table-action" onClick={() => onRename(role)}>{t("system.role.rename")}</BasicButton>}
					{permissions.permissions && <BasicButton type="link" usage="table-action" onClick={() => onConfigure(role)}>{t("system.role.configurePermissions")}</BasicButton>}
					{role.is_system
						? <Tooltip title={t("system.role.builtInDeleteHint")}><LockOutlined className="px-2 text-colorTextTertiary" /></Tooltip>
						: permissions.delete && <BasicButton danger type="link" usage="table-action" onClick={() => onDelete(role)}>{t("common.delete")}</BasicButton>}
				</Flex>
			),
		},
	];
}
