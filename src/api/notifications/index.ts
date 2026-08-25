import { request } from "../client";
import type {
	ListPlatformNotificationsInput,
	PlatformNotification,
	PlatformNotificationPage,
} from "./types";

export * from "./types";

export const platformNotificationsQueryKey = [
	"platform-notifications",
] as const;

interface NotificationPageResponse {
	items: PlatformNotification[];
	page: number;
	page_size: number;
	total: number;
	unread_count: number;
}

export function listPlatformNotifications(
	input: ListPlatformNotificationsInput,
	signal?: AbortSignal,
): Promise<PlatformNotificationPage> {
	return request<NotificationPageResponse>("/account/notifications", {
		query: {
			page: input.page,
			page_size: input.pageSize,
			unread: input.unread,
		},
		signal,
	}).then(({ items, page, page_size, total, unread_count }) => ({
		items,
		page,
		pageSize: page_size,
		total,
		unreadCount: unread_count,
	}));
}

export function markPlatformNotificationRead(notificationId: string) {
	return request<PlatformNotification>(
		`/account/notifications/${notificationId}/read`,
		{ method: "PATCH" },
	);
}

export function markAllPlatformNotificationsRead() {
	return request<{ updated: number }>("/account/notifications/read-all", {
		method: "POST",
	});
}
