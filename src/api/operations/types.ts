export interface PlatformAuditLog {
	id: string;
	actorId?: string;
	actorUsername: string;
	action: string;
	module: string;
	targetId?: string;
	targetType: string;
	requestId: string;
	requestIp: string;
	requestMethod: "DELETE" | "PATCH" | "POST" | "PUT";
	requestPath: string;
	result: "failure" | "success";
	failureReason?: string;
	before?: Record<string, unknown>;
	after?: Record<string, unknown>;
	userAgent?: string;
	durationMs: number;
	createdAt: string;
}

export interface PlatformLoginLog {
	id: string;
	userId?: string;
	identifier: string;
	authMethod: "passkey" | "password" | "sso";
	mfaUsed: boolean;
	requestId: string;
	requestIp: string;
	result: "invalid" | "limited" | "success";
	failureReason?: string;
	sessionId?: string;
	location?: string;
	userAgent?: string;
	acceptLanguage?: string;
	timeZone?: string;
	durationMs: number;
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
