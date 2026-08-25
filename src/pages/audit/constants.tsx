import type { AuditItemType } from "#src/api/audit";
import type { QueryFilterField } from "#src/components/query-filter-panel";
import type { ProColumns } from "@ant-design/pro-components";
import type { TFunction } from "i18next";

import { transformDateTimeRange } from "#src/components/query-filter-panel/utils";

import { Badge, Typography } from "antd";

export function createAuditSearchFields(t: TFunction): QueryFilterField[] {
	return [
		{ label: t("audit.action"), name: "keyword", placeholder: t("audit.searchPlaceholder"), type: "text" },
		{
			label: t("audit.result"),
			name: "result",
			options: [
				{ label: t("audit.success"), value: "success" },
				{ label: t("audit.failed"), value: "failed" },
			],
			type: "select",
		},
		{
			label: t("audit.timeRange"),
			name: "time_range",
			transform: transformDateTimeRange,
			type: "date-time-range",
		},
	];
}

export function createAuditColumns(t: TFunction): ProColumns<AuditItemType>[] {
	return [
		{ title: t("audit.operator"), dataIndex: "operator", width: 160, ellipsis: true },
		{ title: t("audit.action"), dataIndex: "action", width: 180, ellipsis: true, sorter: true, render: (_, record) => <Typography.Text code>{record.action}</Typography.Text> },
		{ title: t("audit.target"), dataIndex: "target", width: 240, ellipsis: true, render: (_, record) => <Typography.Text code>{record.target}</Typography.Text> },
		{
			title: t("audit.result"),
			dataIndex: "result",
			width: 100,
			sorter: true,
			render: (_, record) => <Badge status={record.result === "success" ? "success" : "error"} text={record.result === "success" ? t("audit.success") : t("audit.failed")} />,
		},
		{ title: t("audit.ipAddress"), dataIndex: "ip", width: 150 },
		{ title: t("audit.occurredAt"), dataIndex: "created_at", width: 180, sorter: true },
	];
}
