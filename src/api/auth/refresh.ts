import type { LoginResult } from "./types";

import { rawRequest } from "#src/utils/request/client";

export interface RefreshTokenResult {
	token: string
	refreshToken: string
}

export async function fetchRefreshToken(data: { readonly refreshToken: string }) {
	const response = await rawRequest
		.post("/api/auth/refresh-token", { json: { refresh_token: data.refreshToken } })
		.json<ApiResponse<LoginResult>>();

	if (response.code !== 0 || !response.data) {
		throw new Error(response.msg || "登录状态已失效");
	}

	return {
		...response,
		data: {
			token: response.data.access_token,
			refreshToken: response.data.refresh_token,
		},
	} as ApiResponse<RefreshTokenResult>;
}
