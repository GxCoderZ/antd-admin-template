import { afterEach, describe, expect, it, vi } from "vitest";

import { clearPlatformNotifications, listPlatformNotifications } from "./index";

afterEach(() => {
	vi.unstubAllGlobals();
});

function successResponse(data: unknown) {
	return new Response(JSON.stringify({ code: 0, data, msg: "OK" }), {
		headers: { "Content-Type": "application/json" },
		status: 200,
	});
}

describe("notifications API", () => {
	it("maps trimmed keywords and shared pagination fields", async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			successResponse({
				items: [],
				page: 2,
				page_size: 20,
				total: 26,
				unread_count: 4,
			}),
		);
		vi.stubGlobal("fetch", fetchMock);

		await expect(
			listPlatformNotifications({
				keyword: "  更新  ",
				page: 2,
				pageSize: 20,
				unread: true,
			}),
		).resolves.toMatchObject({ page: 2, pageSize: 20, total: 26 });
		expect(fetchMock).toHaveBeenCalledWith(
			"/api/account/notifications?keyword=%E6%9B%B4%E6%96%B0&page=2&page_size=20&unread=true",
			expect.objectContaining({ method: "GET" }),
		);
	});

	it("clears notifications through the local Fake API namespace", async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValue(successResponse({ deleted: 3 }));
		vi.stubGlobal("fetch", fetchMock);

		await expect(clearPlatformNotifications()).resolves.toEqual({ deleted: 3 });
		expect(fetchMock).toHaveBeenCalledWith(
			"/api/account/notifications",
			expect.objectContaining({ method: "DELETE" }),
		);
	});

	it("surfaces a Fake clear failure", async () => {
		vi.stubGlobal(
			"fetch",
			vi
				.fn()
				.mockResolvedValue(
					new Response(
						JSON.stringify({ code: 500, data: null, msg: "Clear failed" }),
						{ headers: { "Content-Type": "application/json" }, status: 200 },
					),
				),
		);

		await expect(clearPlatformNotifications()).rejects.toMatchObject({
			message: "Clear failed",
			status: 500,
		});
	});
});
