import type { RoleItemType } from "#src/api/system/role";
import type { ProColumns } from "@ant-design/pro-components";
import type { TFunction } from "i18next";

import { BasicButton } from "#src/components/basic-button";

import { EditOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { Space, Tag, Tooltip, Typography } from "antd";

interface RoleColumnPermissions {
	delete: boolean
	edit: boolean
	permissions: boolean
}

interface CreateRoleColumnsOptions {
	onConfigure: (role: RoleItemType) => void
	onDelete: (role: RoleItemType) => void
	onRename: (role: RoleItemType) => void
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

function getPermissionModule(code: string) {
	return code.split(":").slice(0, -1).join(":");
}

export function createRoleColumns({ onConfigure, onDelete, onRename, permissions, t }: CreateRoleColumnsOptions): ProColumns<RoleItemType>[] {
	return [
		{
			title: t("system.role.name"),
			dataIndex: "name",
			width: 160,
			ellipsis: true,
		},
		{
			title: t("system.role.key"),
			dataIndex: "key",
			width: 160,
			render: (_, role) => <Typography.Text code>{role.key}</Typography.Text>,
		},
		{
			title: t("system.role.memberCount"),
			dataIndex: "user_count",
			width: 128,
			align: "right",
		},
		{
			title: t("system.role.permissionSummary"),
			dataIndex: "permission_codes",
			width: 448,
			render: (_, role) => {
				const summaries = Object.entries(role.permission_codes.reduce<Record<string, number>>((result, code) => {
					const module = getPermissionModule(code);
					return { ...result, [module]: (result[module] ?? 0) + 1 };
				}, {}));
				return summaries.length > 0
					? (
						<Space size={2}>
							{summaries.map(([module, count]) => <Tag key={module}>{`${permissionModuleNames[module] ?? module} ${count}`}</Tag>)}
						</Space>
					)
					: <Typography.Text type="secondary">{t("system.role.permissionsNotConfigured")}</Typography.Text>;
			},
		},
		{
			title: t("common.action"),
			valueType: "option",
			key: "option",
			width: 288,
			render: (_, role) => {
				const deleteButton = permissions.delete
					? (
						<BasicButton danger disabled={role.is_system} usage="table-action" onClick={() => onDelete(role)}>
							{t("common.delete")}
						</BasicButton>
					)
					: null;
				return (
					<Space size={4}>
						{permissions.permissions && (
							<BasicButton icon={<SafetyCertificateOutlined />} usage="table-action" onClick={() => onConfigure(role)}>
								{t("system.role.configurePermissions")}
							</BasicButton>
						)}
						{permissions.edit && (
							<BasicButton icon={<EditOutlined />} usage="table-action" onClick={() => onRename(role)}>
								{t("system.role.rename")}
							</BasicButton>
						)}
						{role.is_system && deleteButton
							? <Tooltip title={t("system.role.builtInDeleteHint")}><span>{deleteButton}</span></Tooltip>
							: deleteButton}
					</Space>
				);
			},
		},
	];
}
