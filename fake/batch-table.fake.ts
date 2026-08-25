import { defineFakeRoute } from "vite-plugin-fake-server/client";

import type {
	BatchTableRecord,
	BatchTableRecordStatus,
	BatchTableSelectionInput,
	UpdateBatchTableRecordStatusInput,
} from "../src/api/batch-table";
import { batchTableRecords } from "./store";
import { pageValue, resultError, resultSuccess, routeParam } from "./utils";

function pageRows<T>(items: T[], page: number, pageSize: number) {
	const start = (page - 1) * pageSize;
	return {
		items: items.slice(start, start + pageSize),
		page,
		page_size: pageSize,
		total: items.length,
	};
}

function isStatus(value: unknown): value is BatchTableRecordStatus {
	return value === "active" || value === "disabled";
}

function normalizeIds(input: Partial<BatchTableSelectionInput>) {
	return Array.isArray(input.ids)
		? input.ids.filter((id): id is string => typeof id === "string")
		: [];
}

function assertSelection(ids: string[]) {
	if (ids.length === 0) {
		return "Select at least one record";
	}

	const knownIds = new Set(batchTableRecords.map((item) => item.id));
	return ids.every((id) => knownIds.has(id)) ? null : "Selected record not found";
}

function sortValue(record: BatchTableRecord, sort: string) {
	switch (sort) {
		case "name":
			return record.name;
		case "owner":
			return record.owner;
		case "status":
			return record.status;
		default:
			return record.updatedAt;
	}
}

export default defineFakeRoute([
	{
		method: "get",
		url: "/platform/batch-table-records",
		response: ({ query }) => {
			const page = pageValue(query.page, 1);
			const pageSize = pageValue(query.page_size, 10);
			const keyword = String(query.q ?? "")
				.trim()
				.toLowerCase();
			const category = routeParam(query.category);
			const status = routeParam(query.status);
			const sort = routeParam(query.sort) ?? "updated_at";
			const order = routeParam(query.order) ?? "desc";
			const filtered = batchTableRecords.filter(
				(record) =>
					(!keyword ||
						record.name.toLowerCase().includes(keyword) ||
						record.owner.toLowerCase().includes(keyword)) &&
					(!category || record.category === category) &&
					(!status || record.status === status),
			);
			const sorted = [...filtered].sort(
				(left, right) =>
					sortValue(left, sort).localeCompare(sortValue(right, sort)) *
					(order === "asc" ? 1 : -1),
			);

			return resultSuccess(pageRows(sorted, page, pageSize));
		},
	},
	{
		method: "patch",
		url: "/platform/batch-table-records/status",
		response: ({ body }) => {
			const input = body as Partial<UpdateBatchTableRecordStatusInput>;
			const ids = normalizeIds(input);
			const selectionError = assertSelection(ids);
			if (selectionError) {
				return resultError(selectionError, 422);
			}
			const nextStatus = input.status;
			if (!isStatus(nextStatus)) {
				return resultError("Invalid status", 422);
			}

			const timestamp = new Date().toISOString();
			batchTableRecords.forEach((record) => {
				if (ids.includes(record.id)) {
					record.status = nextStatus;
					record.updatedAt = timestamp;
				}
			});

			return resultSuccess({ affected: ids.length });
		},
	},
	{
		method: "delete",
		url: "/platform/batch-table-records",
		response: ({ body }) => {
			const ids = normalizeIds(body as Partial<BatchTableSelectionInput>);
			const selectionError = assertSelection(ids);
			if (selectionError) {
				return resultError(selectionError, 422);
			}

			for (const id of ids) {
				const index = batchTableRecords.findIndex((record) => record.id === id);
				if (index >= 0) {
					batchTableRecords.splice(index, 1);
				}
			}

			return resultSuccess({ affected: ids.length });
		},
	},
	{
		method: "post",
		url: "/platform/batch-table-records/export",
		response: ({ body }) => {
			const ids = normalizeIds(body as Partial<BatchTableSelectionInput>);
			const selectionError = assertSelection(ids);
			if (selectionError) {
				return resultError(selectionError, 422);
			}

			return resultSuccess({
				fileName: `batch-table-export-${Date.now()}.csv`,
				requestedAt: new Date().toISOString(),
				rowCount: ids.length,
			});
		},
	},
]);
