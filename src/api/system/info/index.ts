import type { SystemInfoType } from "./types";

import { request } from "#src/utils/request";

export * from "./types";

export function fetchSystemInfo() {
	return request
		.post("/api/system/info", { json: {} })
		.json<ApiResponse<SystemInfoType>>();
}
