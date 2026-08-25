import { request } from "../client";
import type { DashboardStatistics, DashboardTodo } from "./types";

export * from "./types";

export const dashboardStatisticsQueryKey = ["dashboard-statistics"] as const;

export function getDashboardStatistics(signal?: AbortSignal) {
	return request<DashboardStatistics>("/platform/dashboard/statistics", {
		signal,
	});
}

export function completeDashboardTodo(todoId: string) {
	return request<DashboardTodo>(`/platform/dashboard/todos/${todoId}`, {
		method: "PATCH",
	});
}
