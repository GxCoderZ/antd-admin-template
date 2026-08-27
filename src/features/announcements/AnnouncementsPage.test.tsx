import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider } from "antd";
import { render, screen, waitFor, within } from "@testing-library/react";
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
	deletePlatformAnnouncements: vi.fn(),
	listPlatformAnnouncements: vi.fn(),
	updatePlatformAnnouncement: vi.fn(),
	updatePlatformAnnouncementStatuses: vi.fn(),
}));

vi.mock("#src/api/announcements", () => ({
	createPlatformAnnouncement: mocks.createPlatformAnnouncement,
	deletePlatformAnnouncement: mocks.deletePlatformAnnouncement,
	deletePlatformAnnouncements: mocks.deletePlatformAnnouncements,
	listPlatformAnnouncements: mocks.listPlatformAnnouncements,
	platformAnnouncementsQueryKey: ["platform-announcements"],
	updatePlatformAnnouncement: mocks.updatePlatformAnnouncement,
	updatePlatformAnnouncementStatuses: mocks.updatePlatformAnnouncementStatuses,
}));

const announcement = {
	content: "平台将在周日凌晨进行例行维护。",
	createdAt: "2026-08-20T00:00:00.000Z",
	id: "announcement-1",
	status: "published" as const,
	title: "系统维护通知",
	updatedAt: "2026-08-20T01:00:00.000Z",
};
const draftAnnouncement = {
	content: "新版本功能仍在准备中。",
	createdAt: "2026-08-21T00:00:00.000Z",
	id: "announcement-2",
	status: "draft" as const,
	title: "版本发布预告",
	updatedAt: "2026-08-21T01:00:00.000Z",
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
	mocks.deletePlatformAnnouncements
		.mockReset()
		.mockResolvedValue({ affected: 2 });
	mocks.updatePlatformAnnouncement.mockReset().mockResolvedValue(announcement);
	mocks.updatePlatformAnnouncementStatuses
		.mockReset()
		.mockResolvedValue({ affected: 2 });
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

async function selectVisibleAnnouncements(
	user: ReturnType<typeof userEvent.setup>,
) {
	const selectAll = await screen.findByRole("checkbox", { name: "Select all" });
	await user.click(selectAll.closest("label") ?? selectAll);
}

describe("AnnouncementsPage", () => {
	it("keeps a failed save editable and retries the same draft", async () => {
		mocks.createPlatformAnnouncement.mockRejectedValueOnce(
			new Error("Save rejected"),
		);
		const user = renderAnnouncementsPage();
		await user.click(await screen.findByRole("button", { name: "新建公告" }));
		const drawer = await screen.findByRole("dialog");
		const title = within(drawer).getByPlaceholderText("请输入公告标题");
		const content = within(drawer).getByPlaceholderText("请输入公告内容");
		await user.type(title, "Retry draft");
		await user.type(content, "Retained content");
		await user.click(within(drawer).getByRole("button", { name: /保\s*存/ }));
		await within(drawer).findByRole("alert");
		expect(title).toHaveValue("Retry draft");
		expect(content).toHaveValue("Retained content");
		expect(title).toBeEnabled();
		await user.click(within(drawer).getByRole("button", { name: /保\s*存/ }));
		await waitFor(() =>
			expect(mocks.createPlatformAnnouncement).toHaveBeenCalledTimes(2),
		);
		expect(mocks.createPlatformAnnouncement).toHaveBeenLastCalledWith({
			title: "Retry draft",
			content: "Retained content",
			status: "draft",
		});
		await waitFor(() =>
			expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
		);
	});

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
			within(screen.getByTestId("admin-announcements-query-form")).getByRole(
				"button",
				{ name: /查\s*询/ },
			),
		).toBeVisible();
		for (const actionName of ["reload", "column-height", "setting"]) {
			expect(screen.getByRole("img", { name: actionName })).toBeVisible();
		}
	});

	it("opens announcement details from the title", async () => {
		const user = renderAnnouncementsPage();

		await screen.findByText("系统维护通知");
		await user.click(screen.getByRole("button", { name: "系统维护通知" }));

		const dialog = await screen.findByRole("dialog");
		expect(within(dialog).getByText("公告详情")).toBeInTheDocument();
		expect(within(dialog).getByText("记录 ID")).toBeInTheDocument();
		expect(
			within(dialog).getByText("平台将在周日凌晨进行例行维护。"),
		).toBeInTheDocument();
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
		const editButton = screen.getAllByRole("button", { name: "编辑" }).at(0);
		if (!editButton) {
			throw new Error("Missing edit button");
		}
		await user.click(editButton);
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
		const deleteButton = screen
			.getAllByRole("button", { name: "删除" })
			.at(0);
		if (!deleteButton) {
			throw new Error("Missing delete button");
		}
		await user.click(deleteButton);
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

	it("shows a single bottom batch toolbar and publishes selected announcements", async () => {
		mocks.listPlatformAnnouncements.mockResolvedValue({
			items: [announcement, draftAnnouncement],
			page: 1,
			pageSize: 10,
			total: 2,
		});
		const user = renderAnnouncementsPage();

		await selectVisibleAnnouncements(user);
		expect(screen.getByTestId("admin-announcements-batch-toolbar")).toBeVisible();
		expect(screen.getByText("已选择 2 项")).toBeVisible();
		expect(screen.getByText("取消选择")).toBeVisible();
		expect(screen.getAllByText(/已选择\s*2\s*项/)).toHaveLength(1);
		await user.click(screen.getByRole("button", { name: "批量发布" }));

		await waitFor(() => {
			expect(
				mocks.updatePlatformAnnouncementStatuses.mock.calls[0]?.[0],
			).toEqual({
				ids: [announcement.id, draftAnnouncement.id],
				status: "published",
			});
		});
		await waitFor(() =>
			expect(
				screen.queryByTestId("admin-announcements-batch-toolbar"),
			).not.toBeInTheDocument(),
		);
	});

	it("confirms dangerous batch deletion", async () => {
		mocks.listPlatformAnnouncements.mockResolvedValue({
			items: [announcement, draftAnnouncement],
			page: 1,
			pageSize: 10,
			total: 2,
		});
		const user = renderAnnouncementsPage();

		await selectVisibleAnnouncements(user);
		await user.click(screen.getByRole("button", { name: "批量删除" }));
		const dialog = await screen.findByRole("dialog");
		expect(dialog).toHaveTextContent("确认批量删除");
		await user.click(screen.getByRole("button", { name: "确认删除" }));

		await waitFor(() => {
			expect(mocks.deletePlatformAnnouncements.mock.calls[0]?.[0]).toEqual({
				ids: [announcement.id, draftAnnouncement.id],
			});
		});
	});
});
