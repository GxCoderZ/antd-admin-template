import { afterEach, describe, expect, it, vi } from "vitest";

import type { DashboardStatistics } from "../src/api/dashboard";
import type { PlatformAnnouncement } from "../src/api/announcements";
import routes from "./dashboard.fake";
import announcementRoutes from "./announcements.fake";
import {
	allPermissions,
	announcements,
	auditLogs,
	loginLogs,
	roles,
	users,
} from "./store";
import { findFakeRoute, readFakeBody } from "./route-helpers";

const getStatistics = findFakeRoute(
	routes,
	"get",
	"/platform/dashboard/statistics",
);
const initialLogins = structuredClone(loginLogs);

function statistics(timeZone = "Asia/Shanghai") {
	return readFakeBody<{ code: number; data: DashboardStatistics }>(
		getStatistics({ query: { time_zone: timeZone } }),
	).data;
}

afterEach(() => {
	loginLogs.splice(0, loginLogs.length, ...structuredClone(initialLogins));
	vi.useRealTimers();
});

describe("Fake dashboard workspace", () => {
	it("returns preview period comparisons and live numeric card footers", () => {
		expect(statistics()).toMatchObject({
			activeUserCount: users.filter((user) => user.status === "active").length,
			builtInRoleCount: roles.filter((role) => role.builtIn).length,
			assignedPermissionCount: new Set(
				roles.flatMap((role) => role.permissions),
			).size,
			metricComparisons: {
				users: { week: 0.12, day: -0.11 },
				roles: { week: 0.08, day: 0.02 },
				permissions: { week: 0.06, day: 0.01 },
				logins: { week: 0.16, day: -0.04 },
			},
		});
	});

	it("returns live domain counts and only the newest published announcements", () => {
		const data = statistics();
		expect(
			getStatistics({ query: { time_zone: "Asia/Shanghai" } }),
		).toMatchObject({ code: 0, msg: "OK" });
		expect(data).toMatchObject({
			userCount: users.length,
			roleCount: roles.length,
			permissionCount: allPermissions.length,
			draftAnnouncementCount: announcements.filter(
				(item) => item.status === "draft",
			).length,
		});
		expect(data.recentLogins.map((item) => item.id)).toEqual(
			loginLogs
				.toSorted((a, b) => b.createdAt.localeCompare(a.createdAt))
				.slice(0, 5)
				.map((item) => item.id),
		);
		expect(data.recentActivities.map((item) => item.id)).toEqual(
			auditLogs
				.toSorted((a, b) => b.createdAt.localeCompare(a.createdAt))
				.slice(0, 5)
				.map((item) => item.id),
		);
		expect(data.latestAnnouncements.map((item) => item.id)).toEqual(
			announcements
				.filter((item) => item.status === "published")
				.toSorted((a, b) => b.updatedAt.localeCompare(a.updatedAt))
				.slice(0, 3)
				.map((item) => item.id),
		);
		expect(data).not.toHaveProperty("todos");
		expect(data).not.toHaveProperty("loginTrend");
	});

	it("counts today's successful and abnormal logins in the requested time zone, excluding future events", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-08-28T01:00:00.000Z"));
		const seed = initialLogins[0]!;
		loginLogs.splice(
			0,
			loginLogs.length,
			{
				...seed,
				id: "yesterday",
				result: "success",
				createdAt: "2026-08-27T15:59:59.000Z",
			},
			{
				...seed,
				id: "midnight",
				result: "success",
				createdAt: "2026-08-27T16:00:00.000Z",
			},
			{
				...seed,
				id: "today",
				result: "success",
				createdAt: "2026-08-28T00:01:00.000Z",
			},
			{
				...seed,
				id: "invalid",
				result: "invalid",
				createdAt: "2026-08-27T23:00:00.000Z",
			},
			{
				...seed,
				id: "limited",
				result: "limited",
				createdAt: "2026-08-28T00:00:00.000Z",
			},
			{
				...seed,
				id: "future",
				result: "success",
				createdAt: "2026-08-28T02:00:00.000Z",
			},
		);
		expect(statistics()).toMatchObject({
			todayLoginCount: 2,
			todayAbnormalLoginCount: 2,
		});
		expect(statistics("UTC")).toMatchObject({
			todayLoginCount: 1,
			todayAbnormalLoginCount: 1,
		});
	});

	it.each(["Not/AZone", ""])(
		"rejects an invalid time zone (%s)",
		(timeZone) => {
			expect(getStatistics({ query: { time_zone: timeZone } })).toMatchObject({
				code: 422,
				data: null,
			});
		},
	);

	it("reflects announcement draft, publish and delete mutations without a separate dashboard store", () => {
		const before = statistics();
		const body = {
			title: "Dashboard notice",
			content: "Preview notice",
			status: "draft",
		};
		const created = readFakeBody<{ data: PlatformAnnouncement }>(
			findFakeRoute(
				announcementRoutes,
				"post",
				"/platform/announcements",
			)({ body }),
		).data;
		try {
			expect(statistics().draftAnnouncementCount).toBe(
				before.draftAnnouncementCount + 1,
			);
			expect(
				statistics().latestAnnouncements.some((item) => item.id === created.id),
			).toBe(false);
			findFakeRoute(
				announcementRoutes,
				"patch",
				"/platform/announcements/:announcementId",
			)({
				body: { ...body, status: "published" },
				params: { announcementId: created.id },
			});
			expect(statistics().draftAnnouncementCount).toBe(
				before.draftAnnouncementCount,
			);
			expect(statistics().latestAnnouncements[0]?.id).toBe(created.id);
		} finally {
			findFakeRoute(
				announcementRoutes,
				"delete",
				"/platform/announcements/:announcementId",
			)({ params: { announcementId: created.id } });
		}
		expect(statistics().latestAnnouncements).toEqual(
			before.latestAnnouncements,
		);
	});

	it("returns empty recent logins and zero daily counts for an empty log store", () => {
		loginLogs.splice(0);
		expect(statistics()).toMatchObject({
			recentLogins: [],
			todayLoginCount: 0,
			todayAbnormalLoginCount: 0,
		});
	});
});
