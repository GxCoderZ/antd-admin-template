import { defineFakeRoute } from "vite-plugin-fake-server/client";

import { loginLogs, session, setSignedIn, signedIn } from "./store";
import { resultError, resultSuccess } from "./utils";

export default defineFakeRoute([
	{
		url: "/platform/auth/session",
		method: "get",
		response: () =>
			signedIn ? resultSuccess(session) : resultError("Please sign in", 401),
	},
	{
		url: "/platform/auth/login",
		method: "post",
		response: ({ body }) => {
			if (!body.identifier || !body.password) {
				return resultError("Username and password are required", 422);
			}
			setSignedIn(true);
			loginLogs.unshift({
				id: `login-${Date.now()}`,
				identifier: String(body.identifier),
				requestIp: "127.0.0.1",
				result: "success",
				userAgent: "Fake Server preview",
				acceptLanguage: "zh-CN",
				timeZone: String(body.timeZone ?? "Asia/Shanghai"),
				createdAt: new Date().toISOString(),
			});
			return resultSuccess(session);
		},
	},
	{
		url: "/platform/auth/logout",
		method: "post",
		response: () => {
			setSignedIn(false);
			return resultSuccess(null);
		},
	},
]);
