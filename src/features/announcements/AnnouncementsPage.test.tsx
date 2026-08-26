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
	deletePlatformAnnouncement: vi.fn(),
	listPlatformAnnouncements: vi.fn(),
	updatePlatformAnnouncement: vi.fn(),
}));

vi.mock("#src/api/announcements", () => ({
	createPlatformAnnouncement: mocks.createPlatformAnnouncement,
	deletePlatformAnnouncement: mocks.deletePlatformAnnouncement,
	listPlatformAnnouncements: mocks.listPlatformAnnouncements,
	platformAnnouncementsQueryKey: ["platform-announcements"],
	updatePlatformAnnouncement: mocks.updatePlatformAnnouncement,
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
	sessionStorage.clear();
	mocks.listPlatformAnnouncements.mockReset().mockResolvedValue({
		items: [announcement],
		page: 1,
		pageSize: 10,
		total: 1,
	});
	mocks.createPlatformAnnouncement.mockReset().mockResolvedValue(announcement);
	mocks.deletePlatformAnnouncement.mockReset().mockResolvedValue(undefined);
	mocks.updatePlatformAnnouncement.mockReset().mockResolvedValue(announcement);
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
	it("keeps both actions visible when a row only has edit and delete", async () => {
		renderAnnouncementsPage();

		await screen.findByText("系统维护通知");
		expect(screen.getByRole("button", { name: "编辑" })).toBeVisible();
		expect(screen.getByRole("button", { name: "删除" })).toBeVisible();
		expect(
			screen.queryByRole("button", { name: "更多" }),
		).not.toBeInTheDocument();
	});

	it("uses the standard management query bar and table toolbar", async () => {
		renderAnnouncementsPage();

		await screen.findByText("系统维护通知");
		expect(screen.getByTestId("admin-announcements-query-form")).toBeVisible();
		expect(
			screen.getByTestId("admin-announcements-query-actions"),
		).toBeVisible();
		for (const actionName of ["刷新", "表格密度", "列设置"]) {
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

	it("edits announcements through the form drawer", async () => {
		const user = renderAnnouncementsPage();

		await screen.findByText("系统维护通知");
		await user.click(screen.getByRole("button", { name: "编辑" }));
		const titleInput = await screen.findByPlaceholderText("请输入公告标题");
		await user.clear(titleInput);
		await user.type(titleInput, "系统维护通知（更新）");
		await user.click(screen.getByRole("button", { name: /保\s*存/ }));

		await waitFor(() => {
			expect(mocks.updatePlatformAnnouncement).toHaveBeenCalledWith({
				announcementId: announcement.id,
				input: {
					content: announcement.content,
					status: announcement.status,
					title: "系统维护通知（更新）",
				},
			});
		});
	});

	it("deletes announcements after explicit confirmation", async () => {
		const user = renderAnnouncementsPage();

		await screen.findByText("系统维护通知");
		await user.click(screen.getByRole("button", { name: "删除" }));
		await user.click(screen.getByRole("button", { name: "确认删除" }));

		await waitFor(() => {
			expect(mocks.deletePlatformAnnouncement.mock.calls[0]?.[0]).toBe(
				announcement.id,
			);
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
