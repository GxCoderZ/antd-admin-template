import { describe, expect, it } from "vitest";

import type { PlatformAnnouncement } from "../src/api/announcements";
import announcementRoutes from "./announcements.fake";
import { findFakeRoute } from "./route-helpers";

interface AnnouncementListPayload {
	data: {
		items: PlatformAnnouncement[];
		page: number;
		page_size: number;
		total: number;
	};
}

function findRoute(method: string, url: string) {
	return findFakeRoute(announcementRoutes, method, url);
}

describe("Fake announcements", () => {
	it.each([
		null,
		{},
		{ title: " ", content: "Content", status: "draft" },
		{ title: "Title", content: "", status: "draft" },
		{ title: "Title", content: "Content", status: "invalid" },
		{ title: "x".repeat(101), content: "Content", status: "draft" },
		{ title: "Title", content: "x".repeat(2001), status: "draft" },
	])(
		"rejects invalid create and update inputs without changing records (%#)",
		(body) => {
			const list = findRoute("get", "/platform/announcements");
			const before = structuredClone(
				list({ query: { page_size: "100" } }) as AnnouncementListPayload,
			);
			const original = before.data.items[0]!;
			const expected = {
				code: 422,
				data: null,
				msg: "Invalid announcement input",
			};
			expect(findRoute("post", "/platform/announcements")({ body })).toEqual(
				expected,
			);
			expect(
				findRoute(
					"patch",
					"/platform/announcements/:announcementId",
				)({ body, params: { announcementId: original.id } }),
			).toEqual(expected);
			expect(list({ query: { page_size: "100" } })).toEqual(before);
		},
	);

	it.each(["patch", "delete"])(
		"returns the error envelope when %s targets a missing record",
		(method) => {
			expect(
				findRoute(
					method,
					"/platform/announcements/:announcementId",
				)({
					body: { title: "Missing", content: "Content", status: "draft" },
					params: { announcementId: "missing-announcement" },
				}),
			).toEqual({ code: 404, data: null, msg: "Announcement not found" });
		},
	);

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
