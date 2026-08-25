import { defineFakeRoute } from "vite-plugin-fake-server/client";

import { resultSuccess } from "./utils";

const startedAt = new Date().toISOString();

export default defineFakeRoute({
	url: "/system/info",
	method: "get",
	response: () =>
		resultSuccess({
			service: "antd-admin-template-fake-ui",
			version: "0.0.0",
			startedAt,
		}),
});
