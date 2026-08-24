import type { DashboardSummaryType } from "./types";

import { request } from "#src/utils/request";

export * from "./types";

export function fetchDashboardSummary() {
	return request
		.post("/api/dashboard/summary", { json: {} })
		.json<ApiResponse<DashboardSummaryType>>();
}
