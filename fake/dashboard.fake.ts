import { defineFakeRoute } from "vite-plugin-fake-server/client";

import type { DashboardStatistics } from "../src/api/dashboard";
import { auditLogs, dashboardTodos, loginLogs, roles, users } from "./store";
import { resultError, resultSuccess, routeParam } from "./utils";

const periodDays = 7;

export function getDashboardStatisticsSnapshot(): DashboardStatistics {
	const periodStart = new Date();
	periodStart.setUTCHours(0, 0, 0, 0);
	periodStart.setUTCDate(periodStart.getUTCDate() - (periodDays - 1));
	const isRecent = ({ createdAt }: { createdAt: string }) =>
		createdAt >= periodStart.toISOString();
	const recentLoginLogs = loginLogs.filter(isRecent);
	const loginTrend = Array.from({ length: periodDays }, (_value, index) => {
		const day = new Date(periodStart);
		day.setUTCDate(periodStart.getUTCDate() + index);
		const date = day.toISOString().slice(0, 10);
		const dailyLogs = recentLoginLogs.filter((item) => item.createdAt.startsWith(date));
		return {
			date,
			failure: dailyLogs.filter((item) => item.result !== "success").length,
			success: dailyLogs.filter((item) => item.result === "success").length,
		};
	});
	const displayTarget = (targetId: string | undefined) =>
		targetId === undefined
			? "-"
			:
		users.find((user) => user.id === targetId)?.displayName ??
		roles.find((role) => role.id === targetId)?.displayName ??
		targetId;

	return {
		auditOperationCount: auditLogs.filter(isRecent).length,
		loginFailureCount: recentLoginLogs.filter(
			(item) => item.result !== "success",
		).length,
		loginSuccessCount: recentLoginLogs.filter(
			(item) => item.result === "success",
		).length,
		loginTrend,
		periodDays,
		recentActivities: auditLogs.slice(0, 6).map((item) => ({
			action: item.action,
			actor: item.actorUsername,
			createdAt: item.createdAt,
			id: item.id,
			result: item.result,
			target: displayTarget(item.targetId),
		})),
		roleCount: roles.length,
		todos: dashboardTodos.map((item) => ({ ...item })),
		userCount: users.length,
	};
}

export default defineFakeRoute([
	{
		url: "/platform/dashboard/statistics",
		method: "get",
		response: () => resultSuccess(getDashboardStatisticsSnapshot()),
	},
	{
		url: "/platform/dashboard/todos/:todoId",
		method: "patch",
		response: ({ params }) => {
			const todo = dashboardTodos.find(
				(item) => item.id === routeParam(params.todoId),
			);
			if (!todo) return resultError("Dashboard todo not found", 404);
			todo.status = "completed";
			return resultSuccess(todo);
		},
	},
]);
