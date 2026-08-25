import type { DashboardMetricType } from "#src/api/dashboard";

import type { ReactNode } from "react";
import { AuditOutlined, SafetyCertificateOutlined, TeamOutlined, UserOutlined } from "@ant-design/icons";

export interface DashboardMetricMeta {
	color: "blue" | "cyan" | "green" | "purple"
	icon: ReactNode
	requiresAuditPermission?: boolean
}

const metricMeta: Record<string, DashboardMetricMeta> = {
	users: { color: "blue", icon: <UserOutlined /> },
	roles: { color: "purple", icon: <TeamOutlined /> },
	permissions: { color: "cyan", icon: <SafetyCertificateOutlined /> },
	operations: { color: "green", icon: <AuditOutlined />, requiresAuditPermission: true },
};

export function createDashboardMetrics(metrics: DashboardMetricType[], canViewAudit: boolean) {
	return metrics.flatMap((metric) => {
		const meta = metricMeta[metric.key];
		if (!meta || (meta.requiresAuditPermission && !canViewAudit))
			return [];
		return [{ metric, meta }];
	});
}
