import type { LoginParams, LoginResult, UserInfoType } from "./types";

import { request } from "#src/utils/request";

export * from "./types";

export function fetchLogin(data: LoginParams) {
	return request
		.post("/api/auth/login", { json: data })
		.json<ApiResponse<LoginResult>>();
}

export function fetchRefreshToken(data: { readonly refreshToken: string }) {
	return request
		.post("/api/auth/refresh-token", { json: { refresh_token: data.refreshToken } })
		.json<ApiResponse<LoginResult>>()
		.then(response => ({
			...response,
			data: {
				token: response.data.access_token,
				refreshToken: response.data.refresh_token,
			},
		}));
}

export function fetchCurrentUser() {
	return request
		.post("/api/auth/current-user", { json: {} })
		.json<ApiResponse<UserInfoType>>();
}
