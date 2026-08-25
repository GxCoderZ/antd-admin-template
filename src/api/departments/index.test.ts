import { afterEach, describe, expect, it, vi } from "vitest";

import {
	createPlatformDepartment,
	deletePlatformDepartment,
	listPlatformDepartments,
	updatePlatformDepartment,
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

describe("departments API", () => {
	it("maps list filters to the local Fake API namespace", async () => {
		const fetchMock = vi.fn().mockResolvedValue(successResponse([]));
		vi.stubGlobal("fetch", fetchMock);

		await expect(
			listPlatformDepartments({ name: "运营", status: "active" }),
		).resolves.toEqual([]);
		expect(fetchMock).toHaveBeenCalledWith(
			"/api/platform/departments?name=%E8%BF%90%E8%90%A5&status=active",
			expect.objectContaining({ method: "GET" }),
		);
	});

	it("creates, updates and deletes departments through /api/platform/departments", async () => {
		const input = {
			code: "support",
			name: "客户支持部",
			parentId: "dept-operations",
			status: "active" as const,
		};
		const responsePayload = {
			...input,
			children: [],
			createdAt: "2026-08-25T00:00:00.000Z",
			id: "dept-support",
			memberCount: 0,
			positionCount: 0,
			updatedAt: "2026-08-25T00:00:00.000Z",
		};
		const fetchMock = vi
			.fn()
			.mockImplementation(() =>
				Promise.resolve(successResponse(responsePayload)),
			);
		vi.stubGlobal("fetch", fetchMock);

		await createPlatformDepartment(input);
		await updatePlatformDepartment({
			departmentId: "dept-support",
			input: { ...input, status: "disabled" },
		});
		await deletePlatformDepartment("dept-support");

		expect(fetchMock).toHaveBeenNthCalledWith(
			1,
			"/api/platform/departments",
			expect.objectContaining({
				body: JSON.stringify(input),
				method: "POST",
			}),
		);
		expect(fetchMock).toHaveBeenNthCalledWith(
			2,
			"/api/platform/departments/dept-support",
			expect.objectContaining({ method: "PATCH" }),
		);
		expect(fetchMock).toHaveBeenNthCalledWith(
			3,
			"/api/platform/departments/dept-support",
			expect.objectContaining({ method: "DELETE" }),
		);
	});
});
