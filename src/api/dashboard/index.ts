import { request } from "../client";
import type { DashboardStatistics } from "./types";

export * from "./types";

export const dashboardStatisticsQueryKey = ["dashboard-statistics"] as const;

export function getDashboardStatistics(timeZone: string, signal?: AbortSignal) {
	return request<DashboardStatistics>("/platform/dashboard/statistics", {
		query: { time_zone: timeZone },
		signal,
	});
}
