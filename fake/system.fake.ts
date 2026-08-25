import { defineFakeRoute } from "vite-plugin-fake-server/client";

import { resultSuccess } from "./utils";

export default defineFakeRoute({
	url: "/system/info",
	method: "get",
	response: () =>
		resultSuccess({
			service: "antd-admin-template-fake-ui",
		}),
});
