import { describe, expect, it } from "vitest";

import type {
	BatchTableRecord,
	BatchTableStatusMutation,
} from "../src/api/batch-table";
import batchTableRoutes from "./batch-table.fake";
import { findFakeRoute } from "./route-helpers";

interface BatchTableListPayload {
	data: {
		items: BatchTableRecord[];
		page: number;
		page_size: number;
		total: number;
	};
}

function findRoute(method: string, url: string) {
	return findFakeRoute(batchTableRoutes, method, url);
}

describe("Fake batch table records", () => {
	it("supports pagination and filtering", () => {
		const listRecords = findRoute("get", "/platform/batch-table-records");
		const firstPage = listRecords({
			query: { page: "1", page_size: "10" },
		}) as BatchTableListPayload;
		const onlineRecords = listRecords({
			query: { page: "1", page_size: "100", status: "online" },
		}) as BatchTableListPayload;
		const scheduledRecords = listRecords({
			query: {
				lastScheduledAt: "1970-01-01 00:00:00",
				page: "1",
				page_size: "100",
			},
		}) as BatchTableListPayload;

		expect(firstPage.data.total).toBeGreaterThanOrEqual(30);
		expect(firstPage.data.items).toHaveLength(10);
		expect(firstPage.data.items[0]?.ruleName).toBe("TradeCode 1");
		expect(onlineRecords.data.items.length).toBeGreaterThan(1);
		expect(
			onlineRecords.data.items.every((item) => item.status === "online"),
		).toBe(true);
		expect(scheduledRecords.data.items.length).toBeGreaterThan(1);
		expect(
			scheduledRecords.data.items.every((item) =>
				item.lastScheduledAt.startsWith("1970-01-01T00:00:00"),
			),
		).toBe(true);
	});

	it("sorts by service call count when requested", () => {
		const listRecords = findRoute("get", "/platform/batch-table-records");
		const sortedRecords = listRecords({
			query: {
				order: "asc",
				page: "1",
				page_size: "10",
				sort: "call_count",
			},
		}) as BatchTableListPayload;
		const callCounts = sortedRecords.data.items.map((item) => item.callCount);

		expect(callCounts).toEqual(
			[...callCounts].sort((left, right) => left - right),
		);
	});

	it("persists bulk status and delete operations in session memory", () => {
		const listRecords = findRoute("get", "/platform/batch-table-records");
		const updateStatus = findRoute(
			"patch",
			"/platform/batch-table-records/status",
		);
		const deleteRecords = findRoute("delete", "/platform/batch-table-records");
		const listPayload = listRecords({
			query: { page: "1", page_size: "3" },
		}) as BatchTableListPayload;
		const ids = listPayload.data.items.slice(0, 2).map((item) => item.id);

		updateStatus({
			body: { ids, status: "closed" satisfies BatchTableStatusMutation },
		});
		const afterStatus = listRecords({
			query: { page: "1", page_size: "100", status: "closed" },
		}) as BatchTableListPayload;
		expect(
			ids.every((id) => afterStatus.data.items.some((item) => item.id === id)),
		).toBe(true);

		deleteRecords({ body: { ids } });
		const afterDelete = listRecords({
			query: { page: "1", page_size: "100" },
		}) as BatchTableListPayload;
		expect(
			ids.every((id) => afterDelete.data.items.every((item) => item.id !== id)),
		).toBe(true);
	});
});
