import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiProblemError } from "../client";
import { getDashboardStatistics } from "./index";
import type { DashboardStatistics } from "./types";

afterEach(() => vi.unstubAllGlobals());

describe("dashboard API", () => {
	it("sends the current time zone and cancellation signal through the shared client", async () => {
		const data: DashboardStatistics = {
			userCount: 0,
			activeUserCount: 0,
			roleCount: 0,
			builtInRoleCount: 0,
			permissionCount: 10,
			assignedPermissionCount: 0,
			todayLoginCount: 0,
			todayAbnormalLoginCount: 0,
			metricComparisons: {
				users: { week: 0.12, day: -0.11 },
				roles: { week: 0.08, day: 0.02 },
				permissions: { week: 0.06, day: 0.01 },
				logins: { week: 0.16, day: -0.04 },
			},
			draftAnnouncementCount: 0,
			recentLogins: [],
			recentActivities: [],
			latestAnnouncements: [],
		};
		const fetchMock = vi
			.fn()
			.mockResolvedValue(
				new Response(JSON.stringify({ code: 0, data, msg: "OK" })),
			);
		vi.stubGlobal("fetch", fetchMock);
		const { signal } = new AbortController();
		await expect(
			getDashboardStatistics("Asia/Shanghai", signal),
		).resolves.toEqual(data);
		expect(fetchMock).toHaveBeenCalledWith(
			"/api/platform/dashboard/statistics?time_zone=Asia%2FShanghai",
			expect.objectContaining({ method: "GET", signal }),
		);
	});

	it("preserves Fake validation errors instead of replacing them with empty statistics", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(
				new Response(
					JSON.stringify({
						code: 422,
						data: null,
						msg: "Invalid dashboard time zone",
					}),
				),
			),
		);
		await expect(getDashboardStatistics("Not/AZone")).rejects.toBeInstanceOf(
			ApiProblemError,
		);
	});
});
