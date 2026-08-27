import { defineFakeRoute } from "vite-plugin-fake-server/client";

import type { DashboardStatistics } from "../src/api/dashboard";
import {
	allPermissions,
	announcements,
	auditLogs,
	loginLogs,
	roles,
	users,
} from "./store";
import { resultError, resultSuccess } from "./utils";

function getDashboardStatisticsSnapshot(
	dayFormat: Intl.DateTimeFormat,
): DashboardStatistics {
	const now = new Date();
	const today = dayFormat.format(now);
	const todayLogins = loginLogs.filter(({ createdAt }) => {
		const date = new Date(createdAt);
		return date <= now && dayFormat.format(date) === today;
	});
	const displayTarget = (targetId: string | undefined) =>
		targetId === undefined
			? "-"
			: (users.find((user) => user.id === targetId)?.displayName ??
				roles.find((role) => role.id === targetId)?.displayName ??
				targetId);

	return {
		userCount: users.length,
		roleCount: roles.length,
		permissionCount: allPermissions.length,
		todayLoginCount: todayLogins.filter((item) => item.result === "success")
			.length,
		todayAbnormalLoginCount: todayLogins.filter(
			(item) => item.result !== "success",
		).length,
		draftAnnouncementCount: announcements.filter(
			(item) => item.status === "draft",
		).length,
		recentLogins: loginLogs
			.toSorted((a, b) => b.createdAt.localeCompare(a.createdAt))
			.slice(0, 5)
			.map(({ id, identifier, result, createdAt }) => ({
				id,
				identifier,
				result,
				createdAt,
			})),
		recentActivities: auditLogs
			.toSorted((a, b) => b.createdAt.localeCompare(a.createdAt))
			.slice(0, 5)
			.map((item) => ({
				action: item.action,
				actor: item.actorUsername,
				createdAt: item.createdAt,
				id: item.id,
				result: item.result,
				target: displayTarget(item.targetId),
			})),
		latestAnnouncements: announcements
			.filter((item) => item.status === "published")
			.toSorted((a, b) => b.updatedAt.localeCompare(a.updatedAt))
			.slice(0, 3)
			.map(({ id, title, updatedAt }) => ({ id, title, updatedAt })),
	};
}

export default defineFakeRoute({
	url: "/platform/dashboard/statistics",
	method: "get",
	response: ({ query }) => {
		if (typeof query.time_zone !== "string" || !query.time_zone) {
			return resultError("Invalid dashboard time zone", 422);
		}
		let dayFormat: Intl.DateTimeFormat;
		try {
			dayFormat = new Intl.DateTimeFormat("en-CA", {
				timeZone: query.time_zone,
				year: "numeric",
				month: "2-digit",
				day: "2-digit",
			});
		} catch (error) {
			if (error instanceof RangeError)
				return resultError("Invalid dashboard time zone", 422);
			throw error;
		}
		return resultSuccess(getDashboardStatisticsSnapshot(dayFormat));
	},
});
