import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider } from "antd";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { LocalePreferencesProvider } from "../../app/LocalePreferencesProvider";
import {
	PermissionContext,
	platformPermissions,
	type PlatformPermission,
} from "../../app/permissions";
import { i18n } from "../../i18n";
import { AnnouncementsPage } from "./AnnouncementsPage";

const mocks = vi.hoisted(() => ({
	createPlatformAnnouncement: vi.fn(),
	listPlatformAnnouncements: vi.fn(),
}));

vi.mock("#src/api/announcements", () => ({
	createPlatformAnnouncement: mocks.createPlatformAnnouncement,
	deletePlatformAnnouncement: vi.fn(),
	listPlatformAnnouncements: mocks.listPlatformAnnouncements,
	platformAnnouncementsQueryKey: ["platform-announcements"],
	updatePlatformAnnouncement: vi.fn(),
}));

const announcement = {
	content: "平台将在周日凌晨进行例行维护。",
	createdAt: "2026-08-20T00:00:00.000Z",
	id: "announcement-1",
	status: "published" as const,
	title: "系统维护通知",
	updatedAt: "2026-08-20T01:00:00.000Z",
};

beforeAll(async () => {
	await i18n.changeLanguage("zh-CN");
});

beforeEach(() => {
	mocks.listPlatformAnnouncements.mockReset().mockResolvedValue({
		items: [announcement],
		page: 1,
		pageSize: 10,
		total: 1,
	});
	mocks.createPlatformAnnouncement.mockReset().mockResolvedValue(announcement);
});

function renderAnnouncementsPage(canManage = true) {
	const queryClient = new QueryClient({
		defaultOptions: {
			mutations: { retry: false },
			queries: { retry: false },
		},
	});
	const permissions: PlatformPermission[] = [
		platformPermissions.announcementsRead,
	];
	if (canManage) {
		permissions.push(platformPermissions.announcementsManage);
	}

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
					<PermissionContext.Provider value={new Set(permissions)}>
						<AnnouncementsPage />
					</PermissionContext.Provider>
				</QueryClientProvider>
			</LocalePreferencesProvider>
		</ConfigProvider>,
	);

	return userEvent.setup();
}

describe("AnnouncementsPage", () => {
	it("keeps edit visible and moves delete into more", async () => {
		const user = renderAnnouncementsPage();

		await screen.findByText("系统维护通知");
		expect(screen.getByRole("button", { name: "编辑" })).toBeVisible();
		expect(
			screen.queryByRole("button", { name: "删除" }),
		).not.toBeInTheDocument();

		await user.click(screen.getByRole("button", { name: "更多" }));
		expect(screen.getByRole("menuitem", { name: "删除" })).toBeInTheDocument();
	});

	it("uses the standard management query bar and table toolbar", async () => {
		renderAnnouncementsPage();

		await screen.findByText("系统维护通知");
		expect(screen.getByTestId("admin-announcements-query-form")).toBeVisible();
		expect(
			screen.getByTestId("admin-announcements-query-actions"),
		).toBeVisible();
		for (const actionName of ["刷新", "表格密度", "表格设置", "表格全屏"]) {
			expect(screen.getByRole("button", { name: actionName })).toBeVisible();
		}
	});

	it("submits keyword filters through the announcements API", async () => {
		const user = renderAnnouncementsPage();

		await screen.findByText("系统维护通知");
		await user.type(screen.getByPlaceholderText("搜索公告标题"), "维护");
		await user.click(screen.getByRole("button", { name: /查\s*询/ }));

		await waitFor(() => {
			expect(mocks.listPlatformAnnouncements).toHaveBeenLastCalledWith(
				expect.objectContaining({ q: "维护" }),
				expect.any(AbortSignal),
			);
		});
	});

	it("creates announcements through the form drawer", async () => {
		const user = renderAnnouncementsPage();

		await screen.findByText("系统维护通知");
		await user.click(screen.getByRole("button", { name: "新建公告" }));
		await user.type(
			await screen.findByPlaceholderText("请输入公告标题"),
			"版本发布通知",
		);
		await user.type(
			screen.getByPlaceholderText("请输入公告内容"),
			"新版本已发布。",
		);
		await user.click(screen.getByRole("button", { name: /保\s*存/ }));

		await waitFor(() => {
			expect(mocks.createPlatformAnnouncement).toHaveBeenCalledWith({
				content: "新版本已发布。",
				status: "draft",
				title: "版本发布通知",
			});
		});
	});

	it("hides management actions without announcement management permission", async () => {
		renderAnnouncementsPage(false);

		await screen.findByText("系统维护通知");
		expect(
			screen.queryByRole("button", { name: "新建公告" }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: "编辑" }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: "更多" }),
		).not.toBeInTheDocument();
	});
});
