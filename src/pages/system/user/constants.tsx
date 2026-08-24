import type { UserItemType } from "#src/api/system/user";
import type { ProColumns } from "@ant-design/pro-components";
import type { TFunction } from "i18next";

import { Tag } from "antd";

export function getConstantColumns(t: TFunction): ProColumns<UserItemType>[] {
	return [
		{
			title: t("system.user.username"),
			dataIndex: "username",
			key: "username",
			width: 150,
			ellipsis: true,
		},
		{
			title: t("common.status"),
			dataIndex: "status",
			key: "status",
			width: 100,
			render: (_, record) => (
				<Tag color={record.status === 1 ? "green" : "red"}>
					{record.status === 1 ? t("common.enable") : t("common.disable")}
				</Tag>
			),
		},
		{
			title: t("common.createdAt"),
			dataIndex: "created_at",
			key: "created_at",
			width: 180,
		},
	];
}
