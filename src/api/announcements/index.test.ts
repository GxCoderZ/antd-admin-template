import { afterEach, describe, expect, it, vi } from "vitest";

import { createPlatformAnnouncement, listPlatformAnnouncements } from "./index";

afterEach(() => {
	vi.unstubAllGlobals();
});

function successResponse(data: unknown) {
	return new Response(JSON.stringify({ code: 0, data, msg: "OK" }), {
		headers: { "Content-Type": "application/json" },
		status: 200,
	});
}

describe("announcements API", () => {
	it("maps list parameters and the shared pagination response", async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			successResponse({
				items: [],
				page: 2,
				page_size: 20,
				total: 26,
			}),
		);
		vi.stubGlobal("fetch", fetchMock);

		await expect(
			listPlatformAnnouncements({
				order: "asc",
				page: 2,
				pageSize: 20,
				q: "维护",
				sort: "title",
			}),
		).resolves.toEqual({ items: [], page: 2, pageSize: 20, total: 26 });
		expect(fetchMock).toHaveBeenCalledWith(
			"/api/platform/announcements?order=asc&page=2&q=%E7%BB%B4%E6%8A%A4&sort=title&page_size=20",
			expect.objectContaining({ method: "GET" }),
		);
	});

	it("creates announcements through the local Fake API namespace", async () => {
		const input = {
			content: "新版本已发布。",
			status: "draft" as const,
			title: "版本发布通知",
		};
		const fetchMock = vi.fn().mockResolvedValue(
			successResponse({
				...input,
				createdAt: "2026-08-25T00:00:00.000Z",
				id: "announcement-created",
				updatedAt: "2026-08-25T00:00:00.000Z",
			}),
		);
		vi.stubGlobal("fetch", fetchMock);

		await createPlatformAnnouncement(input);

		expect(fetchMock).toHaveBeenCalledWith(
			"/api/platform/announcements",
			expect.objectContaining({
				body: JSON.stringify(input),
				method: "POST",
			}),
		);
	});
});
