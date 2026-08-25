import { afterEach, describe, expect, it, vi } from "vitest";

import {
	createEditableTableRow,
	deleteEditableTableRow,
	listEditableTableRows,
	updateEditableTableRow,
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

describe("editable table examples API", () => {
	it("maps list parameters and the shared pagination response", async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			successResponse({
				items: [],
				page: 2,
				page_size: 20,
				total: 36,
			}),
		);
		vi.stubGlobal("fetch", fetchMock);

		await expect(
			listEditableTableRows({
				order: "asc",
				page: 2,
				pageSize: 20,
				q: "预算",
				sort: "priority",
				status: "active",
			}),
		).resolves.toEqual({ items: [], page: 2, pageSize: 20, total: 36 });
		expect(fetchMock).toHaveBeenCalledWith(
			"/api/platform/editable-table-rows?order=asc&page=2&q=%E9%A2%84%E7%AE%97&sort=priority&status=active&page_size=20",
			expect.objectContaining({ method: "GET" }),
		);
	});

	it("creates, updates and deletes rows through the local Fake API namespace", async () => {
		const input = {
			name: "预算复核",
			owner: "Olivia Chen",
			priority: 20,
			progress: 50,
			status: "draft" as const,
		};
		const fetchMock = vi.fn().mockImplementation(() =>
			successResponse({
				...input,
				id: "editable-row-created",
				updatedAt: "2026-08-25T00:00:00.000Z",
			}),
		);
		vi.stubGlobal("fetch", fetchMock);

		await createEditableTableRow(input);
		await updateEditableTableRow({ input, rowId: "editable-row-created" });
		await deleteEditableTableRow("editable-row-created");

		expect(fetchMock).toHaveBeenNthCalledWith(
			1,
			"/api/platform/editable-table-rows",
			expect.objectContaining({
				body: JSON.stringify(input),
				method: "POST",
			}),
		);
		expect(fetchMock).toHaveBeenNthCalledWith(
			2,
			"/api/platform/editable-table-rows/editable-row-created",
			expect.objectContaining({
				body: JSON.stringify(input),
				method: "PATCH",
			}),
		);
		expect(fetchMock).toHaveBeenNthCalledWith(
			3,
			"/api/platform/editable-table-rows/editable-row-created",
			expect.objectContaining({ method: "DELETE" }),
		);
	});
});
