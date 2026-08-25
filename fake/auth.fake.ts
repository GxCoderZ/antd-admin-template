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
			const timestamp = Date.now();
			loginLogs.unshift({
				id: `login-${timestamp}`,
				userId: session.user.id,
				identifier: String(body.identifier),
				authMethod: "password",
				mfaUsed: false,
				requestId: `req-login-${timestamp}`,
				requestIp: "127.0.0.1",
				result: "success",
				sessionId: `session-${timestamp}`,
				location: "Local preview",
				userAgent: "Fake Server preview",
				acceptLanguage: "zh-CN",
				timeZone: String(body.timeZone ?? "Asia/Shanghai"),
				durationMs: 24,
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
