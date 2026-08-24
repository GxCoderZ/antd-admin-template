import { defineFakeRoute } from "vite-plugin-fake-server/client";

import { authenticate, getAccountByToken, refreshSession } from "./store";
import { resultError, resultSuccess } from "./utils";

function getBearerToken(headers: Record<string, string | string[] | undefined>) {
	const authorization = headers.authorization;
	const value = Array.isArray(authorization) ? authorization[0] : authorization;
	return value?.replace(/^Bearer\s+/i, "");
}

export default defineFakeRoute([
	{
		url: "/auth/login",
		method: "post",
		timeout: 250,
		response: ({ body }) => {
			const account = authenticate(body.username, body.password);
			if (!account)
				return resultError("账号或密码错误");

			return resultSuccess({
				access_token: account.token,
				refresh_token: account.refreshToken,
				expires_in: 7200,
			});
		},
	},
	{
		url: "/auth/refresh-token",
		method: "post",
		response: ({ body }) => {
			const account = refreshSession(body.refresh_token);
			return account
				? resultSuccess({ access_token: account.token, refresh_token: account.refreshToken, expires_in: 7200 })
				: resultError("登录状态已失效", 401);
		},
	},
	{
		url: "/auth/current-user",
		method: "post",
		response: ({ headers }) => {
			const account = getAccountByToken(getBearerToken(headers));
			return resultSuccess(account.user);
		},
	},
	{
		url: "/rbac/permissions",
		method: "post",
		response: ({ headers }) => {
			const account = getAccountByToken(getBearerToken(headers));
			return resultSuccess({ permissions: account.permissions });
		},
	},
]);
