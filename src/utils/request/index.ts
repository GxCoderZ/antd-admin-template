import type { Options } from "ky";

import { loginPath } from "#src/router/extra-info";
import { useAuthStore } from "#src/store/auth";
import { usePreferencesStore } from "#src/store/preferences";
import { message } from "#src/utils/static-antd";

import { rawRequest } from "./client";
import { AUTH_HEADER, LANG_HEADER, REFRESH_TOKEN_PATH } from "./constants";
import { handleErrorResponse } from "./error-response";
import { globalProgress } from "./global-progress";
import { goLogin } from "./go-login";
import { refreshTokenAndRetry } from "./refresh";

// 扩展 ky 的 Options 类型
declare module "ky" {
	interface Options {
		/** 是否忽略 loading 状态 */
		ignoreLoading?: boolean
	}
}

// 请求白名单, 请求白名单内的接口不需要携带 token
const requestWhiteList = ["/api/auth/login", "/api/auth/refresh-token"];

const defaultConfig: Options = {
	hooks: {
		beforeRequest: [
			async (request, options) => {
				const ignoreLoading = options.ignoreLoading;
				if (!ignoreLoading) {
					globalProgress.start();
				}
				// 不需要携带 token 的请求
				const isWhiteRequest = requestWhiteList.some(url => request.url.endsWith(url));
				if (!isWhiteRequest) {
					const { token } = useAuthStore.getState();
					request.headers.set(AUTH_HEADER, `Bearer ${token}`);
				}
				// 语言等所有的接口都需要携带
				request.headers.set(LANG_HEADER, usePreferencesStore.getState().language);
			},
		],
		afterResponse: [
			async (request, options, response) => {
				const ignoreLoading = options.ignoreLoading;
				if (!ignoreLoading) {
					globalProgress.done();
				}
				// request error
				if (!response.ok) {
					if (response.status === 401) {
						// 防止刷新 refresh-token 继续接收到的 401 错误，出现死循环
						if ([`/${REFRESH_TOKEN_PATH}`].some(url => request.url.endsWith(url))) {
							goLogin();
							return response;
						}
						// If the token is expired, refresh it and try again.
						const { refreshToken } = useAuthStore.getState();
						// If there is no refresh token, it means that the user has not logged in.
						if (!refreshToken) {
							// 如果页面的路由已经重定向到登录页，则不用跳转直接返回结果
							if (location.pathname === loginPath) {
								return response;
							}
							else {
								goLogin();
								return response;
							}
						}

						return refreshTokenAndRetry(request, options, refreshToken);
					}
					else {
						return handleErrorResponse(response);
					}
				}

				// Fake 接口同样使用统一业务响应结构。
				try {
					const jsonResponse = await response.clone().json() as {
						code: number
						msg: string
						data?: unknown
					};

					if (jsonResponse.code !== 0) {
						message.error(jsonResponse.msg || "请求失败");
						return new Response(JSON.stringify(jsonResponse), {
							status: response.status,
							statusText: response.statusText,
							headers: response.headers,
						});
					}
				}
				catch {
					// JSON 解析失败，返回原始响应
				}

				// request success
				return response;
			},
		],
	},
};

export const request = rawRequest.extend(defaultConfig);
