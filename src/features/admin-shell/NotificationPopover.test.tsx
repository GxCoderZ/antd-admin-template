import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfigProvider } from "antd";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { i18n } from "../../i18n";
import { NotificationPopover } from "./NotificationPopover";

const mocks = vi.hoisted(() => ({
	list: vi.fn(),
	markAll: vi.fn(),
	markRead: vi.fn(),
}));

vi.mock("#src/api/notifications", () => ({
	listPlatformNotifications: mocks.list,
	markAllPlatformNotificationsRead: mocks.markAll,
	markPlatformNotificationRead: mocks.markRead,
	platformNotificationsQueryKey: ["platform-notifications"],
}));

const unreadNotification = {
	content: "请在本周完成账号安全检查。",
	createdAt: "2026-08-26T01:00:00.000Z",
	id: "notification-1",
	kind: "system" as const,
	readAt: null,
	title: "账号安全检查",
};

const readNotification = {
	content: "导入任务已完成。",
	createdAt: "2026-08-25T08:00:00.000Z",
	id: "notification-2",
	kind: "task" as const,
	readAt: "2026-08-25T08:30:00.000Z",
	title: "导入完成",
};

beforeAll(async () => i18n.changeLanguage("zh-CN"));

beforeEach(() => {
	mocks.list.mockReset().mockResolvedValue({
		items: [unreadNotification, readNotification],
		page: 1,
		pageSize: 6,
		total: 2,
		unreadCount: 1,
	});
	mocks.markRead
		.mockReset()
		.mockResolvedValue({ ...unreadNotification, readAt: "now" });
	mocks.markAll.mockReset().mockResolvedValue({ updated: 1 });
});

function renderPopover() {
	const client = new QueryClient({
		defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
	});
	const onNavigate = vi.fn();
	render(
		<ConfigProvider>
			<QueryClientProvider client={client}>
				<NotificationPopover onNavigate={onNavigate} />
			</QueryClientProvider>
		</ConfigProvider>,
	);
	return { onNavigate, user: userEvent.setup() };
}

describe("NotificationPopover", () => {
	it("previews notifications and supports quick read actions", async () => {
		const { user } = renderPopover();

		await screen.findByText("1");
		await user.click(screen.getByRole("button", { name: "通知" }));

		const popover = await screen.findByTestId("notification-popover");
		expect(within(popover).getByText("账号安全检查")).toBeInTheDocument();
		expect(within(popover).getByText("导入完成")).toBeInTheDocument();

		await user.click(
			within(popover).getByRole("button", { name: "标记已读" }),
		);
		await waitFor(() =>
			expect(mocks.markRead.mock.calls[0]?.[0]).toBe("notification-1"),
		);

		await user.click(
			within(popover).getByRole("button", { name: "全部已读" }),
		);
		await waitFor(() => expect(mocks.markAll).toHaveBeenCalled());
	});

	it("opens the full notification center from the preview", async () => {
		const { onNavigate, user } = renderPopover();

		await user.click(await screen.findByRole("button", { name: "通知" }));
		await user.click(screen.getByRole("button", { name: "查看全部消息" }));

		expect(onNavigate).toHaveBeenCalledWith("/account/notifications");
	});
});
