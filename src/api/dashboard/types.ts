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
	activeUserCount: number;
	assignedPermissionCount: number;
	builtInRoleCount: number;
	draftAnnouncementCount: number;
	latestAnnouncements: Pick<
		PlatformAnnouncement,
		"id" | "title" | "updatedAt"
	>[];
	metricComparisons: Record<
		"users" | "roles" | "permissions" | "logins",
		{ week: number; day: number }
	>;
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
