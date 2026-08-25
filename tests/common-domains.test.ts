import { describe, expect, it } from "vitest";

const fakeModules = import.meta.glob("../fake/{dashboard,audit,login-log}.fake.ts", { eager: true });

function getRoutes(modulePath: string) {
	const fakeModule = fakeModules[modulePath] as { default?: any[] } | undefined;
	expect(fakeModule).toBeDefined();
	return fakeModule?.default ?? [];
}

function callRoute(routes: any[], url: string, body: Record<string, unknown> = {}) {
	const route = routes.find(item => item.url === url);
	expect(route).toBeDefined();
	return route?.response?.({ url, rawBody: JSON.stringify(body), body, query: {}, params: {}, headers: {} });
}

describe("common Fake domains", () => {
	it("provides a generic dashboard summary and recent activity", () => {
		const routes = getRoutes("../fake/dashboard.fake.ts");
		const response = callRoute(routes, "/dashboard/summary");

		expect(response.code).toBe(0);
		expect(response.data.metrics).toHaveLength(4);
		expect(response.data.activities.length).toBeGreaterThan(0);
	});

	it("filters and paginates audit records", () => {
		const routes = getRoutes("../fake/audit.fake.ts");
		const response = callRoute(routes, "/audit/list", {
			page: 1,
			page_size: 2,
			module: "用户管理",
		});

		expect(response.code).toBe(0);
		expect(response.data.items).toHaveLength(2);
		expect(response.data.items.every((item: any) => item.module === "用户管理")).toBe(true);
		expect(response.data.total).toBeGreaterThanOrEqual(2);
	});

	it("filters login records by result and time range", () => {
		const routes = getRoutes("../fake/login-log.fake.ts");
		const response = callRoute(routes, "/login-log/list", {
			page: 1,
			page_size: 10,
			result: "failed",
			date_from: "2026-08-24 00:00:00",
			date_to: "2026-08-24 23:59:59",
		});

		expect(response.code).toBe(0);
		expect(response.data.items).toHaveLength(1);
		expect(response.data.items[0]).toMatchObject({ identifier: "unknown@example.local", result: "failed" });
	});
});
