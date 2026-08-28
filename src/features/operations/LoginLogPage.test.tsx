import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider } from "antd";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { LocalePreferencesProvider } from "../../app/LocalePreferencesProvider";
import { getTableColumnSettingsStorageKey } from "../../app/preferenceStorage";
import type { PlatformLoginLog } from "../../api/operations/types";
import { i18n } from "../../i18n";
import { LoginLogPage } from "./LoginLogPage";

const mocks = vi.hoisted(() => ({
	listPlatformLoginLogs: vi.fn(),
}));

vi.mock("#src/api/operations", () => ({
	listPlatformLoginLogs: mocks.listPlatformLoginLogs,
	loginLogsQueryKey: "platform-login-logs",
}));

const loginLog: PlatformLoginLog = {
	authMethod: "password",
	createdAt: "2026-08-25T08:30:00.000Z",
	durationMs: 128,
	id: "login-log-001",
	identifier: "operator",
	mfaUsed: true,
	location: "Shanghai",
	requestId: "req-login-001",
	requestIp: "192.168.1.20",
	result: "success",
	sessionId: "session-001",
	timeZone: "Asia/Shanghai",
	userId: "user-operator",
	userAgent:
		"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128.0.0.0 Safari/537.36",
};

beforeAll(async () => {
	await i18n.changeLanguage("zh-CN");
});

beforeEach(() => {
	localStorage.clear();
	sessionStorage.clear();
	mocks.listPlatformLoginLogs.mockReset().mockResolvedValue({
		items: [loginLog],
		page: 1,
		pageSize: 10,
		total: 1,
	});
});

function renderLoginLogPage() {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false } },
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
					<LoginLogPage />
				</QueryClientProvider>
			</LocalePreferencesProvider>
		</ConfigProvider>,
	);
}

describe("LoginLogPage", () => {
	it("defaults to chronological login review fields", async () => {
		renderLoginLogPage();

		await screen.findByText("operator");
		expect(
			screen
				.getAllByRole("columnheader")
				.map((header) => header.textContent?.replace(/\s+/g, "").trim()),
		).toEqual(["登录时间", "登录标识", "结果", "IP地址", "设备", "操作"]);
	});

	it("keeps raw login metadata in grouped details after all configurable columns are enabled", async () => {
		const visibleColumnKeys = [
			"created_at",
			"identifier",
			"result",
			"requestIp",
			"userAgent",
			"authMethod",
			"mfaUsed",
			"location",
			"browser",
			"operatingSystem",
			"durationMs",
			"actions",
		];
		localStorage.setItem(
			getTableColumnSettingsStorageKey("login-logs"),
			JSON.stringify({
				columnOrder: visibleColumnKeys,
				visibleColumnKeys,
			}),
		);
		renderLoginLogPage();

		await screen.findByText("operator");
		for (const rawColumn of [
			"日志 ID",
			"用户 ID",
			"请求 ID",
			"失败原因",
			"会话 ID",
			"User-Agent",
		]) {
			expect(
				screen.queryByRole("columnheader", { name: rawColumn }),
			).not.toBeInTheDocument();
		}

		fireEvent.click(
			screen.getByRole("button", { name: "查看日志 login-log-001" }),
		);
		const title = await screen.findByText("登录日志详情");
		const dialog = title.closest(".ant-drawer");
		if (!(dialog instanceof HTMLElement)) {
			throw new Error("Login log details drawer was not rendered.");
		}
		expect(within(dialog).getAllByRole("table")).toHaveLength(3);
		for (const duplicate of ["设备", "语言"]) {
			expect(
				within(dialog).queryByText(duplicate, { exact: true }),
			).not.toBeInTheDocument();
		}
		for (const section of ["基本信息", "请求信息", "技术信息"]) {
			expect(within(dialog).getByText(section, { exact: true })).toBeVisible();
		}
		for (const value of [
			"operator",
			"user-operator",
			"req-login-001",
			"Shanghai",
			"session-001",
			"192.168.1.20",
			"128 ms",
		]) {
			expect(within(dialog).getByText(value, { exact: true })).toBeVisible();
		}
	});
});
