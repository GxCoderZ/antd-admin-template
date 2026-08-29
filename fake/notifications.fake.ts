import { defineFakeRoute } from "vite-plugin-fake-server/client";

import { getSettingsState } from "./settings-state";
import { notifications } from "./store";
import { pageValue, resultError, resultSuccess, routeParam } from "./utils";

function emptyNotificationPage(pageSize: number) {
	return {
		items: [],
		page: 1,
		page_size: pageSize,
		total: 0,
		unread_count: 0,
	};
}

export default defineFakeRoute([
	{
		method: "get",
		url: "/account/notifications",
		response: ({ query }) => {
			const requestedPage = pageValue(query.page, 1);
			const pageSize = pageValue(query.page_size, 10);
			if (!getSettingsState().notifications.inboxEnabled) {
				return resultSuccess(emptyNotificationPage(pageSize));
			}
			const keyword = (routeParam(query.keyword) ?? "").trim().toLowerCase();
			const unreadOnly = routeParam(query.unread) === "true";
			const filtered = notifications.filter((notification) => {
				const matchesUnread = !unreadOnly || !notification.readAt;
				const searchableText =
					`${notification.title} ${notification.content}`.toLowerCase();
				return matchesUnread && (!keyword || searchableText.includes(keyword));
			});
			const page = Math.min(
				requestedPage,
				Math.max(1, Math.ceil(filtered.length / pageSize)),
			);
			const start = (page - 1) * pageSize;
			return resultSuccess({
				items: filtered.slice(start, start + pageSize),
				page,
				page_size: pageSize,
				total: filtered.length,
				unread_count: notifications.filter(
					(notification) => !notification.readAt,
				).length,
			});
		},
	},
	{
		method: "delete",
		url: "/account/notifications",
		response: () => {
			if (!getSettingsState().notifications.inboxEnabled) {
				return resultSuccess({ deleted: 0 });
			}
			const deleted = notifications.length;
			notifications.splice(0, notifications.length);
			return resultSuccess({ deleted });
		},
	},
	{
		method: "patch",
		url: "/account/notifications/:notificationId/read",
		response: ({ params }) => {
			if (!getSettingsState().notifications.inboxEnabled) {
				return resultError("Notification center is disabled", 404);
			}
			const notification = notifications.find(
				(item) => item.id === routeParam(params.notificationId),
			);
			if (!notification) return resultError("Notification not found", 404);
			notification.readAt ??= new Date().toISOString();
			return resultSuccess(notification);
		},
	},
	{
		method: "post",
		url: "/account/notifications/read-all",
		response: () => {
			if (!getSettingsState().notifications.inboxEnabled) {
				return resultSuccess({ updated: 0 });
			}
			const timestamp = new Date().toISOString();
			let updated = 0;
			notifications.forEach((notification) => {
				if (!notification.readAt) {
					notification.readAt = timestamp;
					updated += 1;
				}
			});
			return resultSuccess({ updated });
		},
	},
]);
