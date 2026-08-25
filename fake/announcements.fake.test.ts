import { describe, expect, it } from "vitest";

import type { PlatformAnnouncement } from "../src/api/announcements";
import announcementRoutes from "./announcements.fake";

interface AnnouncementListPayload {
	data: {
		items: PlatformAnnouncement[];
		page: number;
		page_size: number;
		total: number;
	};
}

interface TestRoute {
	method?: string;
	response?: (request: {
		body?: unknown;
		params?: Record<string, string>;
		query?: Record<string, string>;
	}) => unknown;
	url: string;
}

function findRoute(method: string, url: string) {
	const route = (announcementRoutes as unknown as TestRoute[]).find(
		(candidate) => candidate.method === method && candidate.url === url,
	);

	if (!route?.response) {
		throw new Error(`Missing Fake route: ${method} ${url}`);
	}

	return route.response;
}

describe("Fake announcements", () => {
	it("supports pagination and representative status filters", () => {
		const listAnnouncements = findRoute("get", "/platform/announcements");
		const firstPage = listAnnouncements({
			query: { page: "1", page_size: "10" },
		}) as AnnouncementListPayload;
		const published = listAnnouncements({
			query: { page: "1", page_size: "100", status: "published" },
		}) as AnnouncementListPayload;

		expect(firstPage.data.total).toBeGreaterThanOrEqual(24);
		expect(firstPage.data.items).toHaveLength(10);
		expect(published.data.items.length).toBeGreaterThan(1);
		expect(
			published.data.items.every((item) => item.status === "published"),
		).toBe(true);
	});

	it("persists create, update and delete operations in the preview session", () => {
		const listAnnouncements = findRoute("get", "/platform/announcements");
		const createAnnouncement = findRoute("post", "/platform/announcements");
		const updateAnnouncement = findRoute(
			"patch",
			"/platform/announcements/:announcementId",
		);
		const deleteAnnouncement = findRoute(
			"delete",
			"/platform/announcements/:announcementId",
		);
		const created = createAnnouncement({
			body: {
				content: "用于验证当前预览会话内存变更。",
				status: "draft",
				title: "Fake CRUD 验证公告",
			},
		}) as { data: PlatformAnnouncement };

		expect(created.data.status).toBe("draft");
		const updated = updateAnnouncement({
			body: {
				content: created.data.content,
				status: "published",
				title: created.data.title,
			},
			params: { announcementId: created.data.id },
		}) as { data: PlatformAnnouncement };
		expect(updated.data.status).toBe("published");

		deleteAnnouncement({ params: { announcementId: created.data.id } });
		const afterDelete = listAnnouncements({
			query: { page: "1", page_size: "100", q: created.data.title },
		}) as AnnouncementListPayload;
		expect(afterDelete.data.items).toHaveLength(0);
	});
});
