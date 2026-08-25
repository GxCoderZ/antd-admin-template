import { defineFakeRoute } from "vite-plugin-fake-server/client";

import type { DashboardStatistics } from "../src/api/dashboard";
import { auditLogs, loginLogs, roles, users } from "./store";
import { resultSuccess } from "./utils";

const periodDays = 7;

export function getDashboardStatisticsSnapshot(): DashboardStatistics {
	const periodStart = new Date();
	periodStart.setUTCHours(0, 0, 0, 0);
	periodStart.setUTCDate(periodStart.getUTCDate() - (periodDays - 1));
	const isRecent = ({ createdAt }: { createdAt: string }) =>
		createdAt >= periodStart.toISOString();
	const recentLoginLogs = loginLogs.filter(isRecent);

	return {
		auditOperationCount: auditLogs.filter(isRecent).length,
		loginFailureCount: recentLoginLogs.filter(
			(item) => item.result !== "success",
		).length,
		loginSuccessCount: recentLoginLogs.filter(
			(item) => item.result === "success",
		).length,
		periodDays,
		roleCount: roles.length,
		userCount: users.length,
	};
}

export default defineFakeRoute({
	url: "/platform/dashboard/statistics",
	method: "get",
	response: () => resultSuccess(getDashboardStatisticsSnapshot()),
});
