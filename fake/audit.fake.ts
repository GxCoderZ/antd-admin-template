import type { AuditListReq } from "#src/api/audit";

import { defineFakeRoute } from "vite-plugin-fake-server/client";

import { listAuditLogs } from "./store";
import { resultSuccess } from "./utils";

export default defineFakeRoute([
	{
		url: "/audit/list",
		method: "post",
		response: ({ body }) => resultSuccess(listAuditLogs(body as AuditListReq)),
	},
]);
