import { describe, expect, it } from "vitest";

import { auditLogs, loginLogs } from "./store";

describe("Fake operation logs", () => {
	it("provides trace and diagnostic fields for audit logs", () => {
		const auditLog = auditLogs[0]!;
		expect(auditLog.durationMs).toBeTypeOf("number");
		expect(auditLog.module).toBeTypeOf("string");
		expect(auditLog.requestId).toBeTypeOf("string");
		expect(auditLog.requestMethod).toBeTypeOf("string");
		expect(auditLog.requestPath).toBeTypeOf("string");
		expect(auditLog.userAgent).toBeTypeOf("string");
		expect(
			auditLogs.find((log) => log.result === "failure")?.failureReason,
		).toBeTypeOf("string");
	});

	it("provides authentication and trace fields for login logs", () => {
		const loginLog = loginLogs[0]!;
		expect(loginLog.authMethod).toBeTypeOf("string");
		expect(loginLog.durationMs).toBeTypeOf("number");
		expect(loginLog.location).toBeTypeOf("string");
		expect(loginLog.mfaUsed).toBeTypeOf("boolean");
		expect(loginLog.requestId).toBeTypeOf("string");

		const successfulLogin = loginLogs.find((log) => log.result === "success");
		expect(successfulLogin?.sessionId).toBeTypeOf("string");
		expect(successfulLogin?.userId).toBeTypeOf("string");
		expect(
			loginLogs.find((log) => log.result !== "success")?.failureReason,
		).toBeTypeOf("string");
	});
});
