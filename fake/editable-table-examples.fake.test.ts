import { describe, expect, it } from "vitest";

import type { EditableTableRow } from "../src/api/editable-table-examples";
import editableTableRoutes from "./editable-table-examples.fake";
import { findFakeRoute } from "./route-helpers";

interface EditableTableListPayload {
	data: {
		items: EditableTableRow[];
		page: number;
		page_size: number;
		total: number;
	};
}

function findRoute(method: string, url: string) {
	return findFakeRoute(editableTableRoutes, method, url);
}

describe("Fake editable table examples", () => {
	it("supports pagination, status filters and numeric sorting", () => {
		const listRows = findRoute("get", "/platform/editable-table-rows");
		const firstPage = listRows({
			query: { page: "1", page_size: "10" },
		}) as EditableTableListPayload;
		const activeRows = listRows({
			query: { page: "1", page_size: "100", status: "active" },
		}) as EditableTableListPayload;
		const priorityAsc = listRows({
			query: {
				order: "asc",
				page: "1",
				page_size: "3",
				sort: "priority",
			},
		}) as EditableTableListPayload;

		expect(firstPage.data.total).toBeGreaterThanOrEqual(24);
		expect(firstPage.data.items).toHaveLength(10);
		expect(activeRows.data.items.length).toBeGreaterThan(1);
		expect(
			activeRows.data.items.every((item) => item.status === "active"),
		).toBe(true);
		expect(priorityAsc.data.items[0]!.priority).toBeLessThanOrEqual(
			priorityAsc.data.items[1]!.priority,
		);
	});

	it("persists create, update and delete operations in the preview session", () => {
		const listRows = findRoute("get", "/platform/editable-table-rows");
		const createRow = findRoute("post", "/platform/editable-table-rows");
		const updateRow = findRoute(
			"patch",
			"/platform/editable-table-rows/:rowId",
		);
		const deleteRow = findRoute(
			"delete",
			"/platform/editable-table-rows/:rowId",
		);
		const created = createRow({
			body: {
				name: "Fake 可编辑行",
				owner: "Noah Wang",
				priority: 77,
				progress: 30,
				status: "draft",
			},
		}) as { data: EditableTableRow };

		expect(created.data.status).toBe("draft");
		const updated = updateRow({
			body: {
				name: "Fake 可编辑行",
				owner: "Noah Wang",
				priority: 77,
				progress: 90,
				status: "active",
			},
			params: { rowId: created.data.id },
		}) as { data: EditableTableRow };
		expect(updated.data.progress).toBe(90);

		deleteRow({ params: { rowId: created.data.id } });
		const afterDelete = listRows({
			query: { page: "1", page_size: "100", q: created.data.name },
		}) as EditableTableListPayload;
		expect(afterDelete.data.items).toHaveLength(0);
	});
});
