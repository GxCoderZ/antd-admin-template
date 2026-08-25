import { defineFakeRoute } from "vite-plugin-fake-server/client";

import type { UpdatePlatformSettingsInput } from "../src/api/settings";
import { setSiteTitle, siteTitle } from "./store";
import { resultSuccess } from "./utils";

let version = 1;

export default defineFakeRoute([
	{
		url: "/platform/settings",
		method: "get",
		response: () => resultSuccess({ siteTitle, version }),
	},
	{
		url: "/platform/settings",
		method: "patch",
		response: ({ body }) => {
			const input = body as unknown as UpdatePlatformSettingsInput;
			setSiteTitle(input.siteTitle.trim() || "React Antd Admin");
			version += 1;
			return resultSuccess({ siteTitle, version });
		},
	},
]);
