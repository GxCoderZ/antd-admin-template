import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider } from "antd";
import {
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router";

import type { DashboardStatistics } from "#src/api/dashboard";
import type { PlatformSettings } from "#src/api/settings";
import { LocalePreferencesProvider } from "../../app/LocalePreferencesProvider";
import { PermissionProvider } from "../../app/PermissionProvider";
import {
	platformPermissions,
	type PlatformPermission,
} from "../../app/permissions";
import { i18n } from "../../i18n";
import { DashboardPage } from "./DashboardPage";

const mocks = vi.hoisted(() => ({
	getStatistics: vi.fn(),
	getSettings: vi.fn(),
	getSystemInfo: vi.fn(),
}));
vi.mock("#src/api/dashboard", () => ({
	dashboardStatisticsQueryKey: ["dashboard-statistics"],
	getDashboardStatistics: mocks.getStatistics,
}));
vi.mock("#src/api/settings", () => ({
	platformSettingsQueryKey: ["platform-settings"],
	getPlatformSettings: mocks.getSettings,
}));
vi.mock("#src/api/system", () => ({
	systemInfoQueryKey: "system-info",
	getSystemInfo: mocks.getSystemInfo,
}));

const statistics: DashboardStatistics = {
	userCount: 32,
	activeUserCount: 28,
	roleCount: 8,
	builtInRoleCount: 2,
	permissionCount: 10,
	assignedPermissionCount: 8,
	todayLoginCount: 18,
	todayAbnormalLoginCount: 2,
	metricComparisons: {
		users: { week: 0.12, day: -0.11 },
		roles: { week: 0.08, day: 0.02 },
		permissions: { week: 0.06, day: 0.01 },
		logins: { week: 0.16, day: -0.04 },
	},
	draftAnnouncementCount: 3,
	recentLogins: [
		{
			id: "login-1",
			identifier: "preview.admin",
			result: "limited",
			createdAt: "2026-08-28T00:00:00.000Z",
		},
	],
	recentActivities: [
		{
			action: "user.update",
			actor: "Platform Admin",
			createdAt: "2026-08-28T00:00:00.000Z",
			id: "activity-1",
			result: "success",
			target: "Preview User",
		},
	],
	latestAnnouncements: [
		{
			id: "notice-1",
			title: "预览版本更新",
			updatedAt: "2026-08-28T00:00:00.000Z",
		},
	],
};
const settings: PlatformSettings = {
	general: {
		siteTitle: "Admin",
		shortTitle: "Admin",
		logoDataUrl: null,
		browserTitle: "Admin",
		copyright: "Preview",
	},
	security: {
		loginAccess: "all",
		maintenanceEnabled: false,
		maintenanceMessage: "系统维护中，请稍后再试。",
		maintenanceEndsAt: null,
		captchaEnabled: false,
		passwordMinLength: 8,
		passwordRequirements: ["lowercase", "number"],
		loginFailureLimit: 5,
		lockoutMinutes: 15,
		idleTimeoutMinutes: 30,
		forceInitialPasswordChange: false,
	},
	notifications: {
		announcementsEnabled: true,
		inboxEnabled: true,
		unreadReminderEnabled: true,
		retentionDays: 90,
	},
	version: 1,
};

beforeAll(async () => i18n.changeLanguage("zh-CN"));
beforeEach(() => {
	vi.clearAllMocks();
	mocks.getStatistics.mockResolvedValue(structuredClone(statistics));
	mocks.getSettings.mockResolvedValue(structuredClone(settings));
	mocks.getSystemInfo.mockResolvedValue({
		version: "0.1.0",
		builtAt: "2026-08-28T00:00:00.000Z",
		service: "antd-admin-template-fake-ui",
		environment: "local-development",
		commitSha: "local",
	});
});

function renderDashboard(
	permissions: PlatformPermission[] = Object.values(platformPermissions),
	client = new QueryClient({
		defaultOptions: { queries: { retry: false, staleTime: Infinity } },
	}),
) {
	return render(
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
				<PermissionProvider permissions={permissions}>
					<QueryClientProvider client={client}>
						<MemoryRouter>
							<Routes>
								<Route path="/" element={<DashboardPage />} />
								<Route
									path="/system/dictionaries"
									element={<h1>字典目的页</h1>}
								/>
							</Routes>
						</MemoryRouter>
					</QueryClientProvider>
				</PermissionProvider>
			</LocalePreferencesProvider>
		</ConfigProvider>,
	);
}

describe("dashboard workspace", () => {
	it("shows the Pro weekly and daily comparisons with numeric footer values", async () => {
		renderDashboard();
		await screen.findByTestId("dashboard-stat-users");
		for (const [key, week, day, footer, value] of [
			["users", "12%", "11%", "启用用户", "28"],
			["roles", "8%", "2%", "内置角色", "2"],
			["permissions", "6%", "1%", "已分配节点", "8"],
			["logins", "16%", "4%", "今日异常", "2"],
		] as const) {
			const card = within(screen.getByTestId(`dashboard-stat-${key}`));
			const content = within(card.getByTestId("chart-card-content"));
			expect(content.getByText("周同比")).toBeVisible();
			expect(content.getByText("日同比")).toBeVisible();
			expect(content.getByText(week)).toBeVisible();
			expect(content.getByText(day)).toBeVisible();
			const field = within(card.getByTestId("chart-card-footer"));
			expect(field.getByText(footer)).toBeVisible();
			expect(field.getByText(value, { exact: true })).toBeVisible();
			expect(card.queryByText("统计范围")).not.toBeInTheDocument();
		}
		const users = within(screen.getByTestId("dashboard-stat-users"));
		expect(users.getByRole("img", { name: "caret-up" })).toBeVisible();
		expect(users.getByRole("img", { name: "caret-down" })).toBeVisible();
	});

	it("shows the four core metrics and five quick entries, with recent logins and operations", async () => {
		renderDashboard();
		expect(
			await screen.findByRole("region", { name: "系统概览" }),
		).toBeVisible();
		for (const [key, value] of Object.entries({
			users: 32,
			roles: 8,
			permissions: 10,
			logins: 18,
		})) {
			expect(screen.getByTestId(`dashboard-stat-${key}`)).toHaveTextContent(
				String(value),
			);
		}
		const entries = within(screen.getByRole("region", { name: "快捷入口" }));
		for (const name of [
			"用户管理",
			"角色管理",
			"字典管理",
			"系统设置",
			"操作日志",
		]) {
			expect(entries.getByRole("link", { name })).toBeVisible();
		}
		expect(screen.getByText("preview.admin")).toBeVisible();
		fireEvent.click(screen.getByRole("tab", { name: "最近操作" }));
		expect(
			await screen.findByText("Platform Admin 更新用户 Preview User"),
		).toBeVisible();
		expect(screen.getByText("预览版本更新")).toBeVisible();
		expect(screen.getByText("今日 2 次登录异常")).toBeVisible();
		expect(screen.getByText("3 条公告待发布")).toBeVisible();
		expect(screen.queryByText("登录趋势")).not.toBeInTheDocument();
		expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
		expect(mocks.getStatistics).toHaveBeenCalledWith(
			"Asia/Shanghai",
			expect.any(AbortSignal),
		);
		fireEvent.click(entries.getByRole("link", { name: "字典管理" }));
		expect(
			await screen.findByRole("heading", { name: "字典目的页" }),
		).toBeVisible();
	});

	it("hides unauthorized metrics, quick entries, logs and draft reminders", async () => {
		renderDashboard([
			platformPermissions.usersRead,
			platformPermissions.announcementsRead,
		]);
		await screen.findByRole("region", { name: "系统概览" });
		expect(screen.getByTestId("dashboard-stat-users")).toBeVisible();
		expect(
			screen.queryByTestId("dashboard-stat-roles"),
		).not.toBeInTheDocument();
		expect(
			screen.queryByTestId("dashboard-stat-permissions"),
		).not.toBeInTheDocument();
		expect(
			screen.queryByTestId("dashboard-stat-logins"),
		).not.toBeInTheDocument();
		expect(
			within(screen.getByRole("region", { name: "快捷入口" })).getAllByRole(
				"link",
			),
		).toHaveLength(1);
		expect(
			screen.queryByRole("tab", { name: "最近登录" }),
		).not.toBeInTheDocument();
		expect(screen.queryByText("3 条公告待发布")).not.toBeInTheDocument();
		expect(screen.getByText("预览版本更新")).toBeVisible();
	});

	it("keeps system status and authorized dictionary entry when there is no statistics permission", async () => {
		renderDashboard([platformPermissions.dictionariesManage]);
		expect(
			await screen.findByRole("region", { name: "系统概览" }),
		).toBeVisible();
		expect(screen.getByRole("link", { name: "字典管理" })).toBeVisible();
		expect(screen.getByText("暂无可查看的概览数据")).toBeVisible();
		expect(mocks.getStatistics).not.toHaveBeenCalled();
	});

	it("shows maintenance and restricted sign-in settings and respects the announcement switch", async () => {
		mocks.getSettings.mockResolvedValue({
			...settings,
			security: {
				...settings.security,
				loginAccess: "adminOnly",
				maintenanceEnabled: true,
				maintenanceMessage: "预览维护提示",
				maintenanceEndsAt: "2026-08-29T00:00:00.000Z",
			},
			notifications: { ...settings.notifications, announcementsEnabled: false },
		});
		renderDashboard();
		expect(await screen.findByText("仅管理员可登录")).toBeVisible();
		expect(screen.getByText("预览维护提示")).toBeVisible();
		expect(screen.getByText(/预计恢复/)).toHaveTextContent("2026");
		expect(screen.getByText("系统公告已关闭")).toBeVisible();
		expect(screen.queryByText("预览版本更新")).not.toBeInTheDocument();
	});

	it("renders empty sections and zero counts as real values", async () => {
		mocks.getStatistics.mockResolvedValue({
			...statistics,
			todayLoginCount: 0,
			todayAbnormalLoginCount: 0,
			draftAnnouncementCount: 0,
			recentLogins: [],
			recentActivities: [],
			latestAnnouncements: [],
		});
		renderDashboard();
		expect(await screen.findByText("暂无登录记录")).toBeVisible();
		expect(screen.getByText("暂无已发布公告")).toBeVisible();
		expect(screen.getByText("今日暂无登录异常")).toBeVisible();
		expect(screen.getByText("暂无待发布公告")).toBeVisible();
		expect(
			within(screen.getByTestId("dashboard-stat-logins")).getAllByText("0", {
				exact: true,
			}),
		).toHaveLength(2);
		fireEvent.click(screen.getByRole("tab", { name: "最近操作" }));
		expect(await screen.findByText("暂无操作记录")).toBeVisible();
	});

	it("uses a loading skeleton without fabricated metrics and allows retry after an error", async () => {
		let rejectRequest: (error: Error) => void = () => {
			throw new Error("Request not started");
		};
		mocks.getStatistics.mockReturnValueOnce(
			new Promise((_resolve, reject) => {
				rejectRequest = reject;
			}),
		);
		renderDashboard();
		expect(screen.getByTestId("dashboard-skeleton")).toBeVisible();
		expect(
			screen.queryByTestId("dashboard-stat-users"),
		).not.toBeInTheDocument();
		rejectRequest(new Error("Preview unavailable"));
		expect(await screen.findByText("系统概览加载失败")).toBeVisible();
		fireEvent.click(screen.getByRole("button", { name: "重新加载" }));
		expect(await screen.findByTestId("dashboard-stat-users")).toBeVisible();
	});

	it("refreshes the aggregate when returning from a management page", async () => {
		const client = new QueryClient({
			defaultOptions: { queries: { retry: false, staleTime: Infinity } },
		});
		const view = renderDashboard(undefined, client);
		await screen.findByTestId("dashboard-stat-users");
		view.unmount();
		mocks.getStatistics.mockResolvedValue({ ...statistics, userCount: 33 });
		renderDashboard(undefined, client);
		await waitFor(() =>
			expect(screen.getByTestId("dashboard-stat-users")).toHaveTextContent(
				"33",
			),
		);
	});
});
