import type { RoleItemType } from "#src/api/system/role";
import type { ProColumns } from "@ant-design/pro-components";
import type { TFunction } from "i18next";

import { Tag } from "antd";

export function getConstantColumns(t: TFunction<"translation", undefined>): ProColumns<RoleItemType>[] {
	return [
		{
			dataIndex: "index",
			title: t("common.index"),
			valueType: "indexBorder",
			width: 80,
		},
		{
			title: t("system.role.name"),
			dataIndex: "name",
			disable: true,
			ellipsis: true,
			width: 120,
			formItemProps: {
				rules: [
					{
						required: true,
						message: t("form.required"),
					},
				],
			},
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
			title: t("common.remark"),
			dataIndex: "remark",
			search: false,
		},
		{
			title: t("common.createTime"),
			dataIndex: "created_at",
			valueType: "date",
			width: 100,
			search: false,
		},
	];
}
