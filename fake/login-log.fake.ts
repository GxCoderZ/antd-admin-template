import type { LoginLogListReq } from "#src/api/login-log";

import { defineFakeRoute } from "vite-plugin-fake-server/client";

import { listLoginLogs } from "./store";
import { resultSuccess } from "./utils";

export default defineFakeRoute([
	{
		url: "/login-log/list",
		method: "post",
		response: ({ body }) => resultSuccess(listLoginLogs(body as LoginLogListReq)),
	},
]);
