import type { PlatformAnnouncement } from "../announcements";
import type { PlatformLoginLog } from "../operations";

interface DashboardRecentActivity {
	action: string;
	actor: string;
	createdAt: string;
	id: string;
	result: "failure" | "success";
	target: string;
}

export interface DashboardStatistics {
	draftAnnouncementCount: number;
	latestAnnouncements: Pick<
		PlatformAnnouncement,
		"id" | "title" | "updatedAt"
	>[];
	permissionCount: number;
	recentActivities: DashboardRecentActivity[];
	recentLogins: Pick<
		PlatformLoginLog,
		"id" | "identifier" | "result" | "createdAt"
	>[];
	roleCount: number;
	todayAbnormalLoginCount: number;
	todayLoginCount: number;
	userCount: number;
}
