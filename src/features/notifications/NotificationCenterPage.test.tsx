import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider } from "antd";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { i18n } from "../../i18n";
import { NotificationCenterPage } from "./NotificationCenterPage";

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

const notification = {
	content: "请在本周完成账号安全检查。",
	createdAt: "2026-08-26T01:00:00.000Z",
	id: "notification-1",
	kind: "system" as const,
	readAt: null,
	title: "账号安全检查",
};

beforeAll(async () => i18n.changeLanguage("zh-CN"));
beforeEach(() => {
	mocks.list.mockReset().mockResolvedValue({
		items: [notification],
		page: 1,
		pageSize: 10,
		total: 1,
		unreadCount: 1,
	});
	mocks.markRead
		.mockReset()
		.mockResolvedValue({ ...notification, readAt: "now" });
	mocks.markAll.mockReset().mockResolvedValue({ updated: 1 });
});

function renderPage() {
	const client = new QueryClient({
		defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
	});
	render(
		<ConfigProvider>
			<QueryClientProvider client={client}>
				<NotificationCenterPage />
			</QueryClientProvider>
		</ConfigProvider>,
	);
	return userEvent.setup();
}

describe("NotificationCenterPage", () => {
	it("renders loading, normal and empty states", async () => {
		let resolve!: (value: unknown) => void;
		mocks.list.mockReturnValue(
			new Promise((next) => {
				resolve = next;
			}),
		);
		renderPage();
		expect(screen.getByTestId("notification-center-loading")).toBeVisible();
		resolve({ items: [], page: 1, pageSize: 10, total: 0, unreadCount: 0 });
		expect(await screen.findByText("暂无站内通知")).toBeVisible();
	});

	it("marks one or all notifications as read", async () => {
		const user = renderPage();
		await screen.findByText("账号安全检查");
		await user.click(screen.getByRole("button", { name: "标记已读" }));
		await waitFor(() =>
			expect(mocks.markRead.mock.calls[0]?.[0]).toBe("notification-1"),
		);
		await user.click(screen.getByRole("button", { name: /全部已读/ }));
		await waitFor(() => expect(mocks.markAll).toHaveBeenCalled());
	});

	it("shows a retryable request failure", async () => {
		mocks.list.mockRejectedValue(new Error("offline"));
		renderPage();
		expect(await screen.findByText("通知加载失败")).toBeVisible();
		expect(screen.getByRole("button", { name: /重\s*试/ })).toBeVisible();
	});
});
