import { describe, expect, it } from "vitest";

import routes, { getDashboardStatisticsSnapshot } from "./dashboard.fake";
import { auditLogs, dashboardTodos, loginLogs, roles, users } from "./store";
import { findFakeRoute } from "./route-helpers";

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

		expect(statistics).toMatchObject({
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
		expect(statistics.loginTrend).toHaveLength(7);
		expect(statistics.todos.length).toBeGreaterThan(0);
		expect(statistics.recentActivities.length).toBeGreaterThan(0);
	});

	it("persists todo completion in the current preview session", () => {
		const completeTodo = findFakeRoute(
			routes,
			"patch",
			"/platform/dashboard/todos/:todoId",
		);
		const todo = dashboardTodos.find((item) => item.status === "pending")!;
		const result = completeTodo({ params: { todoId: todo.id } });

		expect(result).toMatchObject({
			data: { id: todo.id, status: "completed" },
		});
		expect(dashboardTodos.find((item) => item.id === todo.id)?.status).toBe(
			"completed",
		);
	});
});
