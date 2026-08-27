import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider } from "antd";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { LocalePreferencesProvider } from "../../app/LocalePreferencesProvider";
import { clearRouteSessionState } from "../../app/routeSessionState";
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
	sessionStorage.clear();
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
	const view = render(
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
				<QueryClientProvider client={client}>
					<NotificationCenterPage />
				</QueryClientProvider>
			</LocalePreferencesProvider>
		</ConfigProvider>,
	);
	return { user: userEvent.setup(), view };
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
		expect(screen.getByRole("heading", { name: "通知中心" })).toBeVisible();
		expect(screen.getByRole("searchbox", { name: "搜索通知" })).toBeVisible();
		resolve({ items: [], page: 1, pageSize: 10, total: 0, unreadCount: 0 });
		expect(await screen.findByText("暂无站内通知")).toBeVisible();
	});

	it("marks one or all notifications as read", async () => {
		const { user } = renderPage();
		await screen.findByText("账号安全检查");
		await user.click(
			screen.getByRole("button", {
				name: i18n.t("adminShell.notificationCenter.markRead"),
			}),
		);
		await waitFor(() =>
			expect(mocks.markRead.mock.calls[0]?.[0]).toBe("notification-1"),
		);
		await user.click(screen.getByRole("button", { name: /全部已读/ }));
		await waitFor(() => expect(mocks.markAll).toHaveBeenCalled());
	});

	it("prevents conflicting read actions while a row update is pending", async () => {
		let resolveRead!: () => void;
		mocks.markRead.mockReturnValue(
			new Promise<void>((resolve) => {
				resolveRead = resolve;
			}),
		);
		const { user } = renderPage();
		await screen.findByText("账号安全检查");
		await user.click(screen.getByRole("button", { name: "标记已读" }));

		expect(screen.getByRole("button", { name: /全部已读/ })).toBeDisabled();
		expect(screen.getByRole("button", { name: /标记已读/ })).toBeDisabled();
		resolveRead();
		await waitFor(() =>
			expect(screen.getByRole("button", { name: /全部已读/ })).toBeEnabled(),
		);
	});

	it("shows a retryable request failure", async () => {
		mocks.list.mockRejectedValue(new Error("offline"));
		renderPage();
		expect(await screen.findByText("通知加载失败")).toBeVisible();
		expect(screen.getByRole("button", { name: /重\s*试/ })).toBeVisible();
	});

	it("submits keyword and unread filters", async () => {
		const { user } = renderPage();
		await screen.findByText("账号安全检查");
		await user.type(
			screen.getByRole("searchbox", {
				name: i18n.t("adminShell.notificationCenter.searchPlaceholder"),
			}),
			"安全",
		);
		await user.keyboard("{Enter}");
		const unreadRadio = screen.getByRole("radio", { name: "未读" });
		await user.click(unreadRadio.closest("label") ?? unreadRadio);

		await waitFor(() =>
			expect(mocks.list).toHaveBeenLastCalledWith(
				expect.objectContaining({ keyword: "安全", unread: true }),
				expect.any(AbortSignal),
			),
		);
	});

	it("restores route filters and clears them when its tab closes", async () => {
		const first = renderPage();
		await screen.findByText("账号安全检查");
		await first.user.type(
			screen.getByRole("searchbox", {
				name: i18n.t("adminShell.notificationCenter.searchPlaceholder"),
			}),
			"安全",
		);
		await first.user.keyboard("{Enter}");
		const unreadRadio = screen.getByRole("radio", { name: "未读" });
		await first.user.click(unreadRadio.closest("label") ?? unreadRadio);
		first.view.unmount();

		const restored = renderPage();
		expect(
			await screen.findByRole("searchbox", {
				name: i18n.t("adminShell.notificationCenter.searchPlaceholder"),
			}),
		).toHaveValue("安全");
		expect(screen.getByRole("radio", { name: "未读" })).toBeChecked();

		restored.view.unmount();
		clearRouteSessionState("/account/notifications");
		renderPage();
		expect(
			await screen.findByRole("searchbox", {
				name: i18n.t("adminShell.notificationCenter.searchPlaceholder"),
			}),
		).toHaveValue("");
	});
});
