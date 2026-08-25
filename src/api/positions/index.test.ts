import { afterEach, describe, expect, it, vi } from "vitest";

import {
	createPlatformPosition,
	deletePlatformPosition,
	listPlatformPositions,
	updatePlatformPosition,
} from "./index";

afterEach(() => {
	vi.unstubAllGlobals();
});

function successResponse(data: unknown) {
	return new Response(JSON.stringify({ code: 0, data, msg: "OK" }), {
		headers: { "Content-Type": "application/json" },
		status: 200,
	});
}

describe("positions API", () => {
	it("maps list filters, pagination and sorting to the local Fake API namespace", async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			successResponse({
				items: [],
				page: 2,
				page_size: 50,
				total: 24,
			}),
		);
		vi.stubGlobal("fetch", fetchMock);

		await expect(
			listPlatformPositions({
				code: "ops",
				departmentId: "dept-operations",
				name: "专员",
				order: "desc",
				page: 2,
				pageSize: 50,
				sort: "updated_at",
				status: "active",
			}),
		).resolves.toEqual({ items: [], page: 2, pageSize: 50, total: 24 });
		expect(fetchMock).toHaveBeenCalledWith(
			"/api/platform/positions?code=ops&name=%E4%B8%93%E5%91%98&order=desc&page=2&sort=updated_at&status=active&department_id=dept-operations&page_size=50",
			expect.objectContaining({ method: "GET" }),
		);
	});

	it("creates, updates and deletes positions through /api/platform/positions", async () => {
		const input = {
			code: "support_specialist",
			departmentId: "dept-operations",
			name: "客户支持专员",
			status: "active" as const,
		};
		const responsePayload = {
			...input,
			createdAt: "2026-08-25T00:00:00.000Z",
			departmentName: "运营中心",
			id: "position-support",
			memberCount: 0,
			updatedAt: "2026-08-25T00:00:00.000Z",
		};
		const fetchMock = vi
			.fn()
			.mockImplementation(() =>
				Promise.resolve(successResponse(responsePayload)),
			);
		vi.stubGlobal("fetch", fetchMock);

		await createPlatformPosition(input);
		await updatePlatformPosition({
			input: { ...input, status: "disabled" },
			positionId: "position-support",
		});
		await deletePlatformPosition("position-support");

		expect(fetchMock).toHaveBeenNthCalledWith(
			1,
			"/api/platform/positions",
			expect.objectContaining({
				body: JSON.stringify(input),
				method: "POST",
			}),
		);
		expect(fetchMock).toHaveBeenNthCalledWith(
			2,
			"/api/platform/positions/position-support",
			expect.objectContaining({ method: "PATCH" }),
		);
		expect(fetchMock).toHaveBeenNthCalledWith(
			3,
			"/api/platform/positions/position-support",
			expect.objectContaining({ method: "DELETE" }),
		);
	});
});
