type PlatformNotificationKind = "system" | "task" | "user";

export interface PlatformNotification {
	content: string;
	createdAt: string;
	id: string;
	kind: PlatformNotificationKind;
	readAt: string | null;
	title: string;
}

export interface ListPlatformNotificationsInput {
	keyword?: string;
	page: number;
	pageSize: number;
	unread?: boolean;
}

export interface PlatformNotificationPage {
	items: PlatformNotification[];
	page: number;
	pageSize: number;
	total: number;
	unreadCount: number;
}
