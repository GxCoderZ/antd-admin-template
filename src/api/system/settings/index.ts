import type { PlatformSettingsType, PlatformSettingsUpdateReq } from "./types";

import { request } from "#src/utils/request";

export * from "./types";

export function fetchPlatformSettings() {
	return request
		.post("/api/system/settings/get", { json: {} })
		.json<ApiResponse<PlatformSettingsType>>();
}

export function fetchUpdatePlatformSettings(data: PlatformSettingsUpdateReq) {
	return request
		.post("/api/system/settings/update", { json: data })
		.json<ApiResponse<PlatformSettingsType>>();
}
