import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider } from "antd";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router";

import { LocalePreferencesProvider } from "../../app/LocalePreferencesProvider";
import { PermissionProvider } from "../../app/PermissionProvider";
import { platformPermissions } from "../../app/permissions";
import { i18n } from "../../i18n";
import { DashboardPage } from "./DashboardPage";

const mocks = vi.hoisted(() => ({ completeTodo: vi.fn(), getStatistics: vi.fn() }));
vi.mock("#src/api/dashboard", () => ({
	completeDashboardTodo: mocks.completeTodo,
	dashboardStatisticsQueryKey: ["dashboard-statistics"],
	getDashboardStatistics: mocks.getStatistics,
}));

beforeAll(async () => i18n.changeLanguage("zh-CN"));

describe("dashboard template assets", () => {
	it("renders quick entries, todos, recent activity and trend blocks", async () => {
		mocks.completeTodo.mockResolvedValue({ id: "todo-1", status: "completed" });
		mocks.getStatistics.mockResolvedValue({
			auditOperationCount: 12,
			loginFailureCount: 2,
			loginSuccessCount: 18,
			loginTrend: [
				{ date: "2026-08-26", failure: 1, success: 8 },
			],
			periodDays: 7,
			recentActivities: [
				{
					action: "user.update",
					actor: "Platform Admin",
					createdAt: "2026-08-26T00:00:00.000Z",
					id: "activity-1",
					result: "success",
					target: "Olivia Chen",
				},
			],
			roleCount: 8,
			todos: [
				{
					dueAt: "2026-08-27T00:00:00.000Z",
					id: "todo-1",
					priority: "high",
					status: "pending",
					title: "复核本周权限变更",
				},
			],
			userCount: 32,
		});
		const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
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
					<PermissionProvider permissions={Object.values(platformPermissions)}>
						<QueryClientProvider client={client}>
							<MemoryRouter>
								<DashboardPage />
							</MemoryRouter>
						</QueryClientProvider>
					</PermissionProvider>
				</LocalePreferencesProvider>
			</ConfigProvider>,
		);

		expect(await screen.findByText("快捷入口")).toBeVisible();
		expect(screen.getByText("待办事项")).toBeVisible();
		expect(screen.getByText("近期操作")).toBeVisible();
		expect(screen.getByText("登录趋势")).toBeVisible();
		fireEvent.click(
			await screen.findByRole("checkbox", { name: "复核本周权限变更" }),
		);
		await waitFor(() => expect(mocks.completeTodo.mock.calls[0]?.[0]).toBe("todo-1"));
	});
});
