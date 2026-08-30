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
	// Advance calendar dates in UTC; the buckets themselves use the requested zone.
	const loginTrend = Array.from({ length: 7 }, (_, index) => {
		const date = new Date(`${today}T00:00:00.000Z`);
		date.setUTCDate(date.getUTCDate() - 6 + index);
		return {
			date: date.toISOString().slice(0, 10),
			totalCount: 0,
			abnormalCount: 0,
		};
	});
	const days = new Map(loginTrend.map((day) => [day.date, day]));
	for (const log of loginLogs) {
		const date = new Date(log.createdAt);
		if (date > now) continue;
		const day = days.get(dayFormat.format(date));
		if (!day) continue;
		day.totalCount += 1;
		if (log.result !== "success") day.abnormalCount += 1;
	}
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
		loginTrend,
		userCount: users.length,
		activeUserCount: users.filter((user) => user.status === "active").length,
		roleCount: roles.length,
		builtInRoleCount: roles.filter((role) => role.builtIn).length,
		permissionCount: allPermissions.length,
		assignedPermissionCount: new Set(roles.flatMap((role) => role.permissions))
			.size,
		// Fixed comparison samples demonstrate Pro's trend states, not real history.
		metricComparisons: {
			users: { week: 0.12, day: -0.11 },
			roles: { week: 0.08, day: 0.02 },
			permissions: { week: 0.06, day: 0.01 },
			logins: { week: 0.16, day: -0.04 },
		},
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
