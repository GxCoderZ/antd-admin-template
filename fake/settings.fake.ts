import { defineFakeRoute } from "vite-plugin-fake-server/client";

import type { PlatformSettings } from "../src/api/settings";
import { isSettingsUpdate } from "./settings-validation";
import { resultError, resultSuccess } from "./utils";

let settings: PlatformSettings = {
	general: {
		siteTitle: "React Antd Admin",
		shortTitle: "Admin",
		logoDataUrl: null,
		browserTitle: "React Antd Admin",
		copyright: "Copyright 2026 React Antd Admin",
	},
	security: {
		loginAccess: "all",
		maintenanceEnabled: false,
		maintenanceMessage: "系统维护中，请稍后再试。",
		maintenanceEndsAt: null,
		captchaEnabled: false,
		passwordMinLength: 8,
		passwordRequirements: ["lowercase", "number"],
		loginFailureLimit: 5,
		lockoutMinutes: 15,
		idleTimeoutMinutes: 30,
		forceInitialPasswordChange: false,
	},
	notifications: {
		announcementsEnabled: true,
		inboxEnabled: true,
		unreadReminderEnabled: true,
		retentionDays: 90,
	},
	version: 1,
};

export default defineFakeRoute([
	{
		url: "/platform/settings",
		method: "get",
		response: () => resultSuccess(structuredClone(settings)),
	},
	{
		url: "/platform/settings",
		method: "patch",
		response: ({ body }) => {
			if (!isSettingsUpdate(body))
				return resultError("Invalid system settings", 422);
			if (body.expectedVersion !== settings.version)
				return resultError(
					"System settings changed. Reload before saving.",
					409,
				);
			settings = structuredClone({
				general: {
					siteTitle: body.general.siteTitle.trim(),
					shortTitle: body.general.shortTitle.trim(),
					logoDataUrl: body.general.logoDataUrl,
					browserTitle: body.general.browserTitle.trim(),
					copyright: body.general.copyright.trim(),
				},
				security: {
					...body.security,
					maintenanceMessage: body.security.maintenanceMessage.trim(),
				},
				notifications: body.notifications,
				version: settings.version + 1,
			});
			return resultSuccess(structuredClone(settings));
		},
	},
]);
