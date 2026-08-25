import type { LoginLogItemType, LoginLogListReq } from "./types";

import { request } from "#src/utils/request";

export * from "./types";

export function fetchLoginLogList(data: LoginLogListReq) {
	return request
		.post("/api/login-log/list", { json: data })
		.json<ApiListResponse<LoginLogItemType>>();
}
