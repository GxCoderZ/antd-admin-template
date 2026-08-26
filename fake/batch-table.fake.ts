import { defineFakeRoute } from "vite-plugin-fake-server/client";

import type {
	BatchTableRecord,
	BatchTableSelectionInput,
	BatchTableStatusMutation,
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

function isStatusMutation(value: unknown): value is BatchTableStatusMutation {
	return value === "closed" || value === "online";
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
		case "call_count":
			return record.callCount;
		case "rule_name":
			return Number(record.ruleName.match(/\d+$/)?.[0] ?? 0);
		case "status":
			return record.status;
		default:
			return record.lastScheduledAt;
	}
}

export default defineFakeRoute([
	{
		method: "get",
		url: "/platform/batch-table-records",
		response: ({ query }) => {
			const page = pageValue(query.page, 1);
			const pageSize = pageValue(query.page_size, 10);
			const ruleName = String(query.ruleName ?? "")
				.trim()
				.toLowerCase();
			const description = String(query.description ?? "")
				.trim()
				.toLowerCase();
			const callCount = String(query.callCount ?? "").trim();
			const status = routeParam(query.status);
			const sort = routeParam(query.sort) ?? "rule_name";
			const order = routeParam(query.order) ?? "desc";
			const filtered = batchTableRecords.filter(
				(record) =>
					(!ruleName || record.ruleName.toLowerCase().includes(ruleName)) &&
					(!description ||
						record.description.toLowerCase().includes(description)) &&
					(!callCount || String(record.callCount).includes(callCount)) &&
					(!status || record.status === status),
			);
			const sorted = [...filtered].sort(
				(left, right) => {
					const leftValue = sortValue(left, sort);
					const rightValue = sortValue(right, sort);
					const comparison =
						typeof leftValue === "number" && typeof rightValue === "number"
							? leftValue - rightValue
							: String(leftValue).localeCompare(String(rightValue));

					return comparison * (order === "asc" ? 1 : -1);
				},
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
			if (!isStatusMutation(nextStatus)) {
				return resultError("Invalid status", 422);
			}

			batchTableRecords.forEach((record) => {
				if (ids.includes(record.id)) {
					record.status = nextStatus;
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
