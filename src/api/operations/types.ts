export interface PlatformAuditLog {
	id: string;
	actorId?: string;
	actorUsername: string;
	action: string;
	targetId?: string;
	targetType: string;
	requestIp: string;
	result: "failure" | "success";
	before?: Record<string, unknown>;
	after?: Record<string, unknown>;
	createdAt: string;
}

export interface PlatformLoginLog {
	id: string;
	identifier: string;
	requestIp: string;
	result: "invalid" | "limited" | "success";
	userAgent?: string;
	acceptLanguage?: string;
	timeZone?: string;
	createdAt: string;
}

export interface AuditLogRequest {
	page: number;
	pageSize: number;
	sort?: string;
	order?: "asc" | "desc";
	from?: string;
	to?: string;
	action?: string;
	result?: PlatformAuditLog["result"];
}

export interface LoginLogRequest {
	page: number;
	pageSize: number;
	sort?: string;
	order?: "asc" | "desc";
	from?: string;
	to?: string;
	result?: PlatformLoginLog["result"];
}

export type AuditLogFilters = Omit<
	AuditLogRequest,
	"order" | "page" | "pageSize" | "sort"
>;
export type LoginLogFilters = Omit<
	LoginLogRequest,
	"order" | "page" | "pageSize" | "sort"
>;

export interface PlatformAuditLogData {
	items: PlatformAuditLog[];
	page: number;
	pageSize: number;
	total: number;
}

export interface PlatformLoginLogData {
	items: PlatformLoginLog[];
	page: number;
	pageSize: number;
	total: number;
}
