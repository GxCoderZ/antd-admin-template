import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider } from "antd";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { LocalePreferencesProvider } from "../../app/LocalePreferencesProvider";
import { i18n } from "../../i18n";
import { AuditLogPage } from "./AuditLogPage";

const mocks = vi.hoisted(() => ({
	listPlatformAuditLogs: vi.fn(),
}));

vi.mock("#src/api/operations", () => ({
	auditLogsQueryKey: "platform-audit-logs",
	listPlatformAuditLogs: mocks.listPlatformAuditLogs,
}));

const auditLog = {
	action: "platform.user.update",
	actorId: "user-operator",
	actorUsername: "operator",
	after: { status: "disabled" },
	before: { status: "active" },
	createdAt: "2026-08-25T08:30:00.000Z",
	id: "audit-log-001",
	requestIp: "192.168.1.20",
	result: "success" as const,
	targetId: "user-target",
	targetType: "platform-user",
};

beforeAll(async () => {
	await i18n.changeLanguage("zh-CN");
});

beforeEach(() => {
	localStorage.clear();
	mocks.listPlatformAuditLogs.mockReset().mockResolvedValue({
		items: [auditLog],
		page: 1,
		pageSize: 10,
		total: 1,
	});
});

function renderAuditLogPage() {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { retry: false },
		},
	});

	render(
		<ConfigProvider>
			<LocalePreferencesProvider
				value={{
					currency: "CNY",
					language: "zh-CN",
					onChangeCurrency: vi.fn(),
					onChangeTimeZone: vi.fn(),
					timeZone: "Asia/Shanghai",
				}}
			>
				<QueryClientProvider client={queryClient}>
					<AuditLogPage />
				</QueryClientProvider>
			</LocalePreferencesProvider>
		</ConfigProvider>,
	);

	return userEvent.setup();
}

describe("AuditLogPage", () => {
	it("shows every audit log field in the details drawer", async () => {
		const user = renderAuditLogPage();

		await screen.findByText("operator");
		await user.click(
			screen.getByRole("button", { name: "查看日志 audit-log-001" }),
		);

		const title = await screen.findByText("审计日志详情");
		const dialog = title.closest(".ant-drawer");
		if (!(dialog instanceof HTMLElement)) {
			throw new Error("Audit log details drawer was not rendered.");
		}
		for (const label of [
			"日志 ID",
			"操作人 ID",
			"操作人",
			"动作",
			"目标类型",
			"目标 ID",
			"IP 地址",
			"结果",
			"变更前",
			"变更后",
			"发生时间",
		]) {
			expect(within(dialog).getByText(label)).toBeVisible();
		}
		for (const value of [
			"audit-log-001",
			"user-operator",
			"platform.user.update",
			"platform-user",
			"user-target",
			"192.168.1.20",
			'"active"',
			'"disabled"',
		]) {
			expect(within(dialog).getByText(value, { exact: false })).toBeVisible();
		}
	});
});
