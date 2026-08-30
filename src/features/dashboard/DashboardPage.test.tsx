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
import { MemoryRouter } from "react-router";

import type { DashboardStatistics } from "#src/api/dashboard";
import type { PlatformSettings } from "#src/api/settings";
import { LocalePreferencesProvider } from "../../app/LocalePreferencesProvider";
import { PermissionProvider } from "../../app/PermissionProvider";
import { ThemeModeProvider } from "../../app/ThemeModeProvider";
import { defaultPreferences } from "../../app/preferenceStorage";
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
vi.mock("@ant-design/plots", () => ({
	Line: () => <div data-testid="login-line" />,
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
	loginTrend: [{ date: "2026-08-28", totalCount: 20, abnormalCount: 2 }],
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
	},
	notifications: {
		announcementsEnabled: true,
		inboxEnabled: true,
	},
	version: 1,
};

beforeAll(async () => i18n.changeLanguage("zh-CN"));
beforeEach(() => {
	vi.clearAllMocks();
	mocks.getStatistics.mockResolvedValue(structuredClone(statistics));
	mocks.getSettings.mockResolvedValue(structuredClone(settings));
});

function renderDashboard(
	permissions: PlatformPermission[] = Object.values(platformPermissions),
	client = new QueryClient({
		defaultOptions: { queries: { retry: false, staleTime: Infinity } },
	}),
) {
	return render(
		<ConfigProvider>
			<ThemeModeProvider
				value={{
					isColorBlindMode: false,
					isDarkMode: false,
					themeMode: "light",
					themeColor: defaultPreferences.themeColor,
					onChangeColorBlindMode: vi.fn(),
					onChangeThemeColor: vi.fn(),
					onChangeThemeMode: vi.fn(),
				}}
			>
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
								<DashboardPage />
							</MemoryRouter>
						</QueryClientProvider>
					</PermissionProvider>
				</LocalePreferencesProvider>
			</ThemeModeProvider>
		</ConfigProvider>,
	);
}

describe("dashboard workspace", () => {
	it("opens without a system overview or a system information request", async () => {
		renderDashboard();
		expect(await screen.findByTestId("dashboard-stat-users")).toBeVisible();
		expect(
			screen.queryByRole("region", { name: "系统概览" }),
		).not.toBeInTheDocument();
		expect(mocks.getSystemInfo).not.toHaveBeenCalled();
	});

	it("uses recent-activity tabs without a separate card title", async () => {
		renderDashboard();
		const activity = within(
			await screen.findByRole("region", { name: "最近动态" }),
		);
		expect(activity.queryByRole("heading")).not.toBeInTheDocument();
		expect(activity.getAllByRole("tab")).toHaveLength(2);
		expect(activity.getByRole("tab", { name: "最近登录" })).toHaveAttribute(
			"aria-selected",
			"true",
		);
		expect(activity.getByRole("tabpanel", { name: "最近登录" })).toBeVisible();
		fireEvent.click(activity.getByRole("tab", { name: "最近操作" }));
		expect(activity.getByRole("tabpanel", { name: "最近操作" })).toBeVisible();
		expect(
			activity.getByRole("button", { name: "查看操作日志" }),
		).toBeVisible();
	});

	it("shows a visible all-announcements link with read permission only", async () => {
		renderDashboard([platformPermissions.announcementsRead]);
		const announcements = within(
			await screen.findByRole("region", { name: "最新公告" }),
		);
		const link = announcements.getByRole("link", { name: "全部公告" });
		expect(link).toHaveTextContent("全部公告");
		expect(link).toHaveAttribute("href", "/system/announcements");
		expect(announcements.queryByRole("button")).not.toBeInTheDocument();
		expect(announcements.queryByRole("img")).not.toBeInTheDocument();
	});

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
		expect(
			within(screen.getByTestId("dashboard-stat-users")).getAllByText(
				"用户总数",
			),
		).toHaveLength(1);
		const users = within(screen.getByTestId("dashboard-stat-users"));
		expect(users.getByRole("img", { name: "caret-up" })).toBeVisible();
		expect(users.getByRole("img", { name: "caret-down" })).toBeVisible();
	});

	it("shows the four core metrics with recent logins and operations", async () => {
		renderDashboard();
		expect(await screen.findByTestId("dashboard-stat-users")).toBeVisible();
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
		expect(
			screen.queryByRole("region", { name: "快捷入口" }),
		).not.toBeInTheDocument();
		expect(screen.getByText("preview.admin")).toBeVisible();
		fireEvent.click(screen.getByRole("tab", { name: "最近操作" }));
		expect(
			await screen.findByText("Platform Admin 更新用户 Preview User"),
		).toBeVisible();
		expect(screen.getByText("预览版本更新")).toBeVisible();
		expect(screen.getByText("今日 2 次登录异常")).toBeVisible();
		expect(screen.getByText("3 条公告待发布")).toBeVisible();
		expect(
			screen.getByRole("region", { name: "近 7 天登录趋势" }),
		).toBeVisible();
		expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
		expect(mocks.getStatistics).toHaveBeenCalledWith(
			"Asia/Shanghai",
			expect.any(AbortSignal),
		);
	});

	it("hides unauthorized metrics, logs and draft reminders", async () => {
		renderDashboard([
			platformPermissions.usersRead,
			platformPermissions.announcementsRead,
		]);
		await screen.findByTestId("dashboard-stat-users");
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
			screen.queryByRole("tab", { name: "最近登录" }),
		).not.toBeInTheDocument();
		expect(screen.queryByText("3 条公告待发布")).not.toBeInTheDocument();
		expect(
			screen.queryByRole("region", { name: "近 7 天登录趋势" }),
		).not.toBeInTheDocument();
		expect(screen.getByText("预览版本更新")).toBeVisible();
	});

	it("keeps maintenance reminders without statistics permission", async () => {
		renderDashboard([]);
		await screen.findByText("当前未开启维护模式");
		expect(screen.getByText("当前未开启维护模式")).toBeVisible();
		expect(screen.getByText("暂无可查看的概览数据")).toBeVisible();
		expect(mocks.getStatistics).not.toHaveBeenCalled();
		expect(
			screen.queryByRole("region", { name: "最新公告" }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole("link", { name: "全部公告" }),
		).not.toBeInTheDocument();
	});

	it("keeps maintenance details and respects the announcement switch", async () => {
		mocks.getSettings.mockResolvedValue({
			...settings,
			security: {
				...settings.security,
				maintenanceEnabled: true,
				maintenanceMessage: "预览维护提示",
			},
			notifications: { ...settings.notifications, announcementsEnabled: false },
		});
		renderDashboard();
		expect(await screen.findByText("预览维护提示")).toBeVisible();
		expect(screen.getByText("系统公告已关闭")).toBeVisible();
		expect(screen.queryByText("预览版本更新")).not.toBeInTheDocument();
	});

	it("renders empty sections and zero counts as real values", async () => {
		mocks.getStatistics.mockResolvedValue({
			...statistics,
			todayLoginCount: 0,
			loginTrend: [{ date: "2026-08-28", totalCount: 0, abnormalCount: 0 }],
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
		expect(screen.getByText("近 7 天暂无登录记录")).toBeVisible();
		expect(screen.queryByTestId("login-line")).not.toBeInTheDocument();
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
		expect(await screen.findByText("仪表盘加载失败")).toBeVisible();
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
