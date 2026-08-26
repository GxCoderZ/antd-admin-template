import { describe, expect, it } from "vitest";

import type { PlatformNotification } from "../src/api/notifications";
import notificationRoutes from "./notifications.fake";
import { findFakeRoute } from "./route-helpers";

function findRoute(method: string, url: string) {
	return findFakeRoute(notificationRoutes, method, url);
}

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
});
