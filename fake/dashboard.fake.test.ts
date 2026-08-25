import { describe, expect, it } from "vitest";

import { getDashboardStatisticsSnapshot } from "./dashboard.fake";
import { auditLogs, loginLogs, roles, users } from "./store";

describe("Fake dashboard statistics", () => {
	it("aggregates the current in-memory domain state", () => {
		const statistics = getDashboardStatisticsSnapshot();
		const periodStart = new Date();
		periodStart.setUTCHours(0, 0, 0, 0);
		periodStart.setUTCDate(
			periodStart.getUTCDate() - (statistics.periodDays - 1),
		);
		const isRecent = ({ createdAt }: { createdAt: string }) =>
			createdAt >= periodStart.toISOString();
		const recentLoginLogs = loginLogs.filter(isRecent);

		expect(statistics).toEqual({
			auditOperationCount: auditLogs.filter(isRecent).length,
			loginFailureCount: recentLoginLogs.filter(
				(item) => item.result !== "success",
			).length,
			loginSuccessCount: recentLoginLogs.filter(
				(item) => item.result === "success",
			).length,
			periodDays: 7,
			roleCount: roles.length,
			userCount: users.length,
		});
	});
});
