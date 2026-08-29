import { afterEach, describe, expect, it } from "vitest";

import type { PlatformNotification } from "../src/api/notifications";
import { announcements, notifications } from "./store";
import notificationRoutes from "./notifications.fake";
import { findFakeRoute } from "./route-helpers";
import { resetSettingsState } from "./settings-state";
import settingsRoutes from "./settings.fake";

function findRoute(method: string, url: string) {
	return findFakeRoute(notificationRoutes, method, url);
}

const initialNotifications = structuredClone(notifications);

afterEach(() => {
	notifications.splice(
		0,
		notifications.length,
		...structuredClone(initialNotifications),
	);
	resetSettingsState();
});

describe("Fake notification center", () => {
	it("lists unread notifications and persists read mutations", () => {
		const list = findRoute("get", "/account/notifications");
		const markRead = findRoute(
			"patch",
			"/account/notifications/:notificationId/read",
		);
		const markAllRead = findRoute("post", "/account/notifications/read-all");
		const initial = list({ query: { unread: "true" } }) as {
			data: { items: PlatformNotification[]; unread_count: number };
		};

		expect(initial.data.items.length).toBeGreaterThan(1);
		expect(initial.data.items.every((item) => !item.readAt)).toBe(true);
		markRead({ params: { notificationId: initial.data.items[0]!.id } });
		const afterOne = list({ query: { unread: "true" } }) as typeof initial;
		expect(afterOne.data.unread_count).toBe(initial.data.unread_count - 1);

		markAllRead({});
		const afterAll = list({ query: { unread: "true" } }) as typeof initial;
		expect(afterAll.data.items).toHaveLength(0);
		expect(afterAll.data.unread_count).toBe(0);
	});

	it("returns a not-found error for an unknown notification", () => {
		const markRead = findRoute(
			"patch",
			"/account/notifications/:notificationId/read",
		);
		expect(
			markRead({ params: { notificationId: "notification-missing" } }),
		).toMatchObject({ code: 404 });
	});

	it("filters trimmed keywords across titles and content before pagination", () => {
		const list = findRoute("get", "/account/notifications");
		const titleMatch = list({
			query: { keyword: "  安全检查  ", page: "1", page_size: "1" },
		}) as {
			data: { items: PlatformNotification[]; page: number; total: number };
		};
		const contentMatch = list({
			query: { keyword: "第 2 条", page: "1", page_size: "10" },
		}) as { data: { items: PlatformNotification[]; total: number } };

		expect(titleMatch.data).toMatchObject({ page: 1, total: 5 });
		expect(titleMatch.data.items).toHaveLength(1);
		expect(titleMatch.data.items[0]?.title).toContain("账号安全检查完成");
		expect(contentMatch.data.items).toHaveLength(1);
		expect(contentMatch.data.items[0]?.content).toContain("第 2 条");
	});

	it("clears only notifications and retains announcements", () => {
		const clear = findRoute("delete", "/account/notifications");
		const list = findRoute("get", "/account/notifications");
		const announcementCount = announcements.length;

		expect(clear({})).toEqual({
			code: 0,
			data: { deleted: initialNotifications.length },
			msg: "OK",
		});
		expect(list({ query: { page: "1", page_size: "10" } })).toMatchObject({
			data: { items: [], total: 0, unread_count: 0 },
		});
		expect(announcements).toHaveLength(announcementCount);
	});

	it("normalizes pagination after notifications disappear from another view", () => {
		const list = findRoute("get", "/account/notifications");
		const markAll = findRoute("post", "/account/notifications/read-all");
		markAll({});
		expect(
			list({ query: { unread: "true", page: "2", page_size: "10" } }),
		).toMatchObject({ data: { page: 1, total: 0, items: [] } });
	});

	it("hides inbox data while preserving messages for re-enabled previews", () => {
		const list = findRoute("get", "/account/notifications");
		const markAllRead = findRoute("post", "/account/notifications/read-all");
		const updateSettings = findFakeRoute(
			settingsRoutes,
			"patch",
			"/platform/settings",
		);
		const readSettings = findFakeRoute(
			settingsRoutes,
			"get",
			"/platform/settings",
		);
		const current = readSettings({}) as {
			data: { notifications: { inboxEnabled: boolean }; version: number };
		};
		const { version, ...currentValues } = current.data;

		updateSettings({
			body: {
				...currentValues,
				notifications: { ...current.data.notifications, inboxEnabled: false },
				expectedVersion: version,
			},
		});
		expect(list({ query: { unread: "true" } })).toMatchObject({
			data: { items: [], total: 0, unread_count: 0 },
		});
		expect(markAllRead({})).toMatchObject({ data: { updated: 0 } });

		const disabled = readSettings({}) as typeof current;
		const { version: disabledVersion, ...disabledValues } = disabled.data;
		updateSettings({
			body: {
				...disabledValues,
				notifications: {
					...disabled.data.notifications,
					inboxEnabled: true,
				},
				expectedVersion: disabledVersion,
			},
		});
		expect(list({ query: { unread: "true" } })).toMatchObject({
			data: {
				unread_count: initialNotifications.filter((item) => !item.readAt)
					.length,
			},
		});
	});
});
