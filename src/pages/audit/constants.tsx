import type { AuditItemType } from "#src/api/audit";
import type { ProColumns } from "@ant-design/pro-components";

import type { TFunction } from "i18next";
import { Tag } from "antd";

export function getAuditColumns(t: TFunction): ProColumns<AuditItemType>[] {
	return [
		{ title: t("audit.operator"), dataIndex: "operator", key: "keyword" },
		{
			title: t("audit.module"),
			dataIndex: "module",
			valueType: "select",
			valueEnum: {
				用户管理: { text: t("audit.modules.user") },
				角色管理: { text: t("audit.modules.role") },
				权限管理: { text: t("audit.modules.permission") },
			},
		},
		{ title: t("audit.action"), dataIndex: "action", search: false },
		{ title: t("audit.target"), dataIndex: "target", search: false },
		{
			title: t("audit.result"),
			dataIndex: "result",
			valueType: "select",
			valueEnum: {
				success: { text: t("audit.success") },
				failed: { text: t("audit.failed") },
			},
			render: (_, record) => (
				<Tag color={record.result === "success" ? "success" : "error"}>
					{record.result === "success" ? t("audit.success") : t("audit.failed")}
				</Tag>
			),
		},
		{ title: "IP", dataIndex: "ip", search: false },
		{ title: t("common.createdAt"), dataIndex: "created_at", valueType: "dateTime", search: false },
	];
}
