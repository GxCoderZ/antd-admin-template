import { defineFakeRoute } from "vite-plugin-fake-server/client";

import { getPlatformSettings, updatePlatformSettings } from "./store";
import { resultError, resultSuccess } from "./utils";

export default defineFakeRoute([
	{
		url: "/system/settings/get",
		method: "post",
		response: () => resultSuccess(getPlatformSettings()),
	},
	{
		url: "/system/settings/update",
		method: "post",
		response: ({ body }) => {
			const siteTitle = String(body.site_title ?? "").trim();
			if (!siteTitle || siteTitle.length > 40)
				return resultError("站点标题长度应为 1 到 40 个字符");
			return resultSuccess(updatePlatformSettings(siteTitle));
		},
	},
	{
		url: "/system/info",
		method: "post",
		response: () => resultSuccess({ service: "Admin Temp Fake Server", version: "1.0.0", started_at: "2026-08-25 08:00:00" }),
	},
]);
