import { describe, expect, it } from "vitest";

import type {
	BatchTableRecord,
	BatchTableRecordStatus,
} from "../src/api/batch-table";
import batchTableRoutes from "./batch-table.fake";

interface BatchTableListPayload {
	data: {
		items: BatchTableRecord[];
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
	const route = (batchTableRoutes as unknown as TestRoute[]).find(
		(candidate) => candidate.method === method && candidate.url === url,
	);

	if (!route?.response) {
		throw new Error(`Missing Fake route: ${method} ${url}`);
	}

	return route.response;
}

describe("Fake batch table records", () => {
	it("supports pagination, filtering and sorting", () => {
		const listRecords = findRoute("get", "/platform/batch-table-records");
		const firstPage = listRecords({
			query: { page: "1", page_size: "10" },
		}) as BatchTableListPayload;
		const activeRecords = listRecords({
			query: { page: "1", page_size: "100", status: "active" },
		}) as BatchTableListPayload;

		expect(firstPage.data.total).toBeGreaterThanOrEqual(30);
		expect(firstPage.data.items).toHaveLength(10);
		expect(activeRecords.data.items.length).toBeGreaterThan(1);
		expect(
			activeRecords.data.items.every((item) => item.status === "active"),
		).toBe(true);
	});

	it("persists bulk status, export and delete operations in session memory", () => {
		const listRecords = findRoute("get", "/platform/batch-table-records");
		const updateStatus = findRoute(
			"patch",
			"/platform/batch-table-records/status",
		);
		const exportRecords = findRoute(
			"post",
			"/platform/batch-table-records/export",
		);
		const deleteRecords = findRoute("delete", "/platform/batch-table-records");
		const listPayload = listRecords({
			query: { page: "1", page_size: "3", sort: "name", order: "asc" },
		}) as BatchTableListPayload;
		const ids = listPayload.data.items.slice(0, 2).map((item) => item.id);

		updateStatus({
			body: { ids, status: "disabled" satisfies BatchTableRecordStatus },
		});
		const afterStatus = listRecords({
			query: { page: "1", page_size: "100", status: "disabled" },
		}) as BatchTableListPayload;
		expect(ids.every((id) => afterStatus.data.items.some((item) => item.id === id))).toBe(
			true,
		);

		const exported = exportRecords({ body: { ids } }) as {
			data: { rowCount: number };
		};
		expect(exported.data.rowCount).toBe(2);

		deleteRecords({ body: { ids } });
		const afterDelete = listRecords({
			query: { page: "1", page_size: "100" },
		}) as BatchTableListPayload;
		expect(
			ids.every((id) => afterDelete.data.items.every((item) => item.id !== id)),
		).toBe(true);
	});
});
