import { defineFakeRoute } from "vite-plugin-fake-server/client";

import { notifications } from "./store";
import { pageValue, resultError, resultSuccess, routeParam } from "./utils";

export default defineFakeRoute([
	{
		method: "get",
		url: "/account/notifications",
		response: ({ query }) => {
			const page = pageValue(query.page, 1);
			const pageSize = pageValue(query.page_size, 10);
			const unreadOnly = routeParam(query.unread) === "true";
			const filtered = unreadOnly
				? notifications.filter((notification) => !notification.readAt)
				: notifications;
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
		method: "patch",
		url: "/account/notifications/:notificationId/read",
		response: ({ params }) => {
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
