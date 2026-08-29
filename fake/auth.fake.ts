import { defineFakeRoute } from "vite-plugin-fake-server/client";

import { getSettingsState } from "./settings-state";
import { loginLogs, session, setSignedIn, signedIn } from "./store";
import { resultError, resultSuccess } from "./utils";

function isDemoAdministrator(identifier: string) {
	return ["admin", "platform.admin", "platform_admin"].includes(
		identifier.trim().toLowerCase(),
	);
}

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
			const identifier = String(body.identifier);
			const settings = getSettingsState();
			const canRecoverSettings = isDemoAdministrator(identifier);
			if (settings.security.maintenanceEnabled && !canRecoverSettings) {
				return resultError(settings.security.maintenanceMessage, 403);
			}
			if (
				settings.security.loginAccess === "adminOnly" &&
				!canRecoverSettings
			) {
				return resultError("当前仅允许管理员登录。", 403);
			}
			if (settings.security.loginAccess === "disabled" && !canRecoverSettings) {
				return resultError("登录入口已暂停，管理员仍可登录恢复演示设置。", 403);
			}
			setSignedIn(true);
			const timestamp = Date.now();
			loginLogs.unshift({
				id: `login-${timestamp}`,
				userId: session.user.id,
				identifier,
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
