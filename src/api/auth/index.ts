import type { LoginParams, LoginResult, UserInfoType } from "./types";

import { request } from "#src/utils/request";

export { fetchRefreshToken } from "./refresh";
export type { RefreshTokenResult } from "./refresh";
export * from "./types";

export function fetchLogin(data: LoginParams) {
	return request
		.post("/api/auth/login", { json: data })
		.json<ApiResponse<LoginResult>>();
}

export function fetchCurrentUser() {
	return request
		.post("/api/auth/current-user", { json: {} })
		.json<ApiResponse<UserInfoType>>();
}
