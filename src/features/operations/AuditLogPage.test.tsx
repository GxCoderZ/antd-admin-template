import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider } from "antd";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { LocalePreferencesProvider } from "../../app/LocalePreferencesProvider";
import type { PlatformAuditLog } from "../../api/operations/types";
import { i18n } from "../../i18n";
import { AuditLogPage } from "./AuditLogPage";

const mocks = vi.hoisted(() => ({
	listPlatformAuditLogs: vi.fn(),
}));

vi.mock("#src/api/operations", () => ({
	auditLogsQueryKey: "platform-audit-logs",
	listPlatformAuditLogs: mocks.listPlatformAuditLogs,
}));

const auditLog: PlatformAuditLog = {
	action: "platform.user.update",
	actorId: "user-operator",
	actorUsername: "operator",
	after: { status: "disabled" },
	before: { status: "active" },
	createdAt: "2026-08-25T08:30:00.000Z",
	durationMs: 128,
	id: "audit-log-001",
	module: "用户管理",
	requestId: "req-audit-001",
	requestIp: "192.168.1.20",
	requestMethod: "PATCH",
	requestPath: "/api/platform/users/user-target",
	result: "success",
	targetId: "user-target",
	targetType: "platform-user",
	userAgent:
		"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128.0.0.0 Safari/537.36",
};

beforeAll(async () => {
	await i18n.changeLanguage("zh-CN");
});

beforeEach(() => {
	localStorage.clear();
	sessionStorage.clear();
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
	it("defaults to chronological audit review fields", async () => {
		renderAuditLogPage();

		await screen.findByText("operator");
		expect(
			screen
				.getAllByRole("columnheader")
				.map((header) => header.textContent?.replace(/\s+/g, "").trim()),
		).toEqual(["发生时间", "操作人", "动作", "目标", "结果", "IP地址", "操作"]);
	});

	it("requests the initial audit list without an explicit sort", async () => {
		renderAuditLogPage();

		await screen.findByText("operator");
		expect(mocks.listPlatformAuditLogs).toHaveBeenLastCalledWith(
			{ page: 1, pageSize: 10 },
			expect.any(AbortSignal),
		);
	});

	it("clears manual sorting when audit filters are reset", async () => {
		const user = renderAuditLogPage();

		await screen.findByText("operator");
		const actionHeader = screen.getByRole("columnheader", { name: "动作" });
		await user.click(actionHeader);
		await waitFor(() => {
			expect(mocks.listPlatformAuditLogs).toHaveBeenLastCalledWith(
				{ order: "asc", page: 1, pageSize: 10, sort: "action" },
				expect.any(AbortSignal),
			);
		});

		mocks.listPlatformAuditLogs.mockClear();
		await user.click(screen.getByRole("button", { name: /重\s*置/ }));
		await waitFor(() => {
			expect(mocks.listPlatformAuditLogs).toHaveBeenLastCalledWith(
				{ page: 1, pageSize: 10 },
				expect.any(AbortSignal),
			);
		});
		expect(actionHeader).not.toHaveAttribute("aria-sort");
	});

	it("shows every audit log field in the details drawer", async () => {
		const user = renderAuditLogPage();

		await screen.findByText("operator");
		await user.click(screen.getByLabelText("查看日志 audit-log-001"));

		const dialog = await screen.findByRole("dialog");
		expect(within(dialog).getByText("审计日志详情")).toBeVisible();
		expect(within(dialog).getAllByRole("table")).toHaveLength(3);
		for (const duplicate of ["目标", "设备"]) {
			expect(
				within(dialog).queryByText(duplicate, { exact: true }),
			).not.toBeInTheDocument();
		}
		for (const label of [
			"日志 ID",
			"请求 ID",
			"操作人",
			"操作人 ID",
			"动作",
			"功能模块",
			"目标类型",
			"目标 ID",
			"结果",
			"IP 地址",
			"请求方法",
			"请求路径",
			"失败原因",
			"浏览器",
			"操作系统",
			"耗时",
			"变更前",
			"变更后",
			"User-Agent",
			"发生时间",
		]) {
			expect(within(dialog).getByText(label, { exact: true })).toBeVisible();
		}
		for (const value of [
			"audit-log-001",
			"req-audit-001",
			"user-operator",
			"platform.user.update",
			"用户管理",
			"platform-user",
			"user-target",
			"192.168.1.20",
			"PATCH",
			"/api/platform/users/user-target",
			"128 ms",
		]) {
			expect(within(dialog).getByText(value, { exact: true })).toBeVisible();
		}
		expect(
			within(dialog).getByText('"active"', { exact: false }),
		).toBeVisible();
		expect(
			within(dialog).getByText('"disabled"', { exact: false }),
		).toBeVisible();
	});
});
