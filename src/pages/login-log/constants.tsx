import type { LoginLogItemType } from "#src/api/login-log";
import type { QueryFilterField } from "#src/components/query-filter-panel";
import type { ProColumns } from "@ant-design/pro-components";
import type { TFunction } from "i18next";

import { transformDateTimeRange } from "#src/components/query-filter-panel/utils";

import { Badge } from "antd";

export function createLoginLogSearchFields(t: TFunction): QueryFilterField[] {
	return [
		{
			label: t("login-log.result"),
			name: "result",
			options: [
				{ label: t("login-log.success"), value: "success" },
				{ label: t("login-log.failed"), value: "failed" },
			],
			type: "select",
		},
		{
			label: t("login-log.timeRange"),
			name: "time_range",
			transform: transformDateTimeRange,
			type: "date-time-range",
		},
	];
}

export function createLoginLogColumns(t: TFunction): ProColumns<LoginLogItemType>[] {
	return [
		{ title: t("login-log.identifier"), dataIndex: "identifier", width: 180, ellipsis: true, sorter: true },
		{
			title: t("login-log.result"),
			dataIndex: "result",
			width: 120,
			sorter: true,
			render: (_, record) => <Badge status={record.result === "success" ? "success" : "error"} text={record.result === "success" ? t("login-log.success") : t("login-log.failed")} />,
		},
		{ title: t("login-log.device"), dataIndex: "device", width: 260, ellipsis: true },
		{ title: t("login-log.ipAddress"), dataIndex: "ip", width: 150 },
		{ title: t("login-log.language"), dataIndex: "language", width: 130 },
		{ title: t("login-log.timeZone"), dataIndex: "time_zone", width: 180, ellipsis: true },
		{ title: t("login-log.occurredAt"), dataIndex: "created_at", width: 180, sorter: true },
	];
}
