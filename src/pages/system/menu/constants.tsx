import type { MenuItemType } from "#src/api/system/menu";
import type { ProColumns } from "@ant-design/pro-components";
import type { TFunction } from "i18next";

import { Badge, Tag } from "antd";

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

export function createPermissionColumns(t: TFunction): ProColumns<MenuItemType>[] {
	return [
		{ title: t("system.menu.name"), dataIndex: "name", width: 180, ellipsis: true, hideInSearch: true },
		{ title: t("system.menu.perms"), dataIndex: "code", width: 260, ellipsis: true, copyable: true, hideInSearch: true },
		{
			title: t("system.menu.module"),
			dataIndex: "module",
			width: 150,
			hideInSearch: true,
			render: (_, record) => <Tag>{permissionModuleNames[record.module] ?? record.module}</Tag>,
		},
		{
			title: t("common.status"),
			dataIndex: "status",
			width: 100,
			valueType: "select",
			valueEnum: { 1: { text: t("common.enabled") }, 2: { text: t("common.disabled") } },
			render: (_, record) => <Badge status={record.status === 1 ? "success" : "default"} text={record.status === 1 ? t("common.enabled") : t("common.disabled")} />,
		},
		{ title: t("system.menu.remark"), dataIndex: "remark", width: 180, ellipsis: true, hideInSearch: true },
		{ title: t("common.createdAt"), dataIndex: "created_at", width: 180, hideInSearch: true },
	];
}
