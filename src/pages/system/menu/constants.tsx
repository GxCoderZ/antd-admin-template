import type { MenuItemType } from "#src/api/system/menu";
import type { ProColumns } from "@ant-design/pro-components";
import type { TFunction } from "i18next";

import { Tag } from "antd";

export function getConstantColumns(t: TFunction<"translation", undefined>): ProColumns<MenuItemType>[] {
	const moduleNameMap: Record<string, string> = {
		"dashboard": "工作台",
		"audit": "审计日志",
		"system:user": "用户管理",
		"system:role": "角色管理",
		"system:permission": "权限管理",
	};

	return [
		{
			dataIndex: "index",
			title: t("common.index"),
			valueType: "indexBorder",
			width: 80,
		},
		{
			title: t("system.menu.name"),
			dataIndex: "name",
			ellipsis: true,
			width: 180,
		},
		{
			title: t("system.menu.module"),
			dataIndex: "module",
			width: 120,
			ellipsis: true,
			render: (_, record) => moduleNameMap[record.module] || record.module,
		},
		{
			disable: true,
			title: t("common.status"),
			dataIndex: "status",
			valueType: "select",
			width: 80,
			render: (text, record) => {
				return <Tag color={record.status === 1 ? "success" : "default"}>{text}</Tag>;
			},
			valueEnum: {
				1: {
					text: t("common.enabled"),
				},
				2: {
					text: t("common.deactivated"),
				},
			},
		},
		{
			title: t("system.menu.remark"),
			dataIndex: "remark",
			width: 150,
			search: false,
			ellipsis: true,
		},
		{
			title: t("common.createTime"),
			dataIndex: "created_at",
			valueType: "date",
			width: 150,
			search: false,
		},
	];
}
