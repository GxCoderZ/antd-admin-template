import type { AuditItemType, AuditListReq } from "./types";

import { request } from "#src/utils/request";

export * from "./types";

export function fetchAuditList(data: AuditListReq) {
	return request
		.post("/api/audit/list", { json: data })
		.json<ApiListResponse<AuditItemType>>();
}
