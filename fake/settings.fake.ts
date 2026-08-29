import { defineFakeRoute } from "vite-plugin-fake-server/client";

import { isSettingsUpdate } from "./settings-validation";
import { getSettingsState, updateSettingsState } from "./settings-state";
import { resultError, resultSuccess } from "./utils";

export default defineFakeRoute([
	{
		url: "/platform/settings",
		method: "get",
		response: () => resultSuccess(getSettingsState()),
	},
	{
		url: "/platform/settings",
		method: "patch",
		response: ({ body }) => {
			if (!isSettingsUpdate(body))
				return resultError("Invalid system settings", 422);
			if (body.expectedVersion !== getSettingsState().version)
				return resultError(
					"System settings changed. Reload before saving.",
					409,
				);
			return resultSuccess(
				updateSettingsState({
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
				}),
			);
		},
	},
]);
