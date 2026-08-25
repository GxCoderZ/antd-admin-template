import { request, type ApiPage } from "../client";
import type {
	AuditLogRequest,
	LoginLogRequest,
	PlatformAuditLog,
	PlatformAuditLogData,
	PlatformLoginLog,
	PlatformLoginLogData,
} from "./types";

export * from "./types";

export const auditLogsQueryKey = "platform-audit-logs";
export const loginLogsQueryKey = "platform-login-logs";

export function listPlatformAuditLogs(
	input: AuditLogRequest,
	signal?: AbortSignal,
) {
	const { pageSize, ...query } = input;
	return request<ApiPage<PlatformAuditLog>>("/platform/audit-logs", {
		query: { ...query, page_size: pageSize },
		signal,
	}).then(({ items, page, page_size, total }): PlatformAuditLogData => ({
		items,
		page,
		pageSize: page_size,
		total,
	}));
}

export function listPlatformLoginLogs(
	input: LoginLogRequest,
	signal?: AbortSignal,
) {
	const { pageSize, ...query } = input;
	return request<ApiPage<PlatformLoginLog>>("/platform/login-logs", {
		query: { ...query, page_size: pageSize },
		signal,
	}).then(({ items, page, page_size, total }): PlatformLoginLogData => ({
		items,
		page,
		pageSize: page_size,
		total,
	}));
}
