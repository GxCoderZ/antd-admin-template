import { request, type ApiPage } from "../client";
import type {
	BatchTableExportResult,
	BatchTableRecord,
	BatchTableRecordData,
	BatchTableSelectionInput,
	ListBatchTableRecordsInput,
	UpdateBatchTableRecordStatusInput,
} from "./types";

export * from "./types";

export const batchTableRecordsQueryKey = ["batch-table-records"] as const;

export function listBatchTableRecords(
	input: ListBatchTableRecordsInput,
	signal?: AbortSignal,
) {
	const { pageSize, ...query } = input;
	return request<ApiPage<BatchTableRecord>>("/platform/batch-table-records", {
		query: { ...query, page_size: pageSize },
		signal,
	}).then(({ items, page, page_size, total }): BatchTableRecordData => ({
		items,
		page,
		pageSize: page_size,
		total,
	}));
}

export function updateBatchTableRecordStatus(
	input: UpdateBatchTableRecordStatusInput,
) {
	return request<{ affected: number }>("/platform/batch-table-records/status", {
		body: input,
		method: "PATCH",
	});
}

export function deleteBatchTableRecords(input: BatchTableSelectionInput) {
	return request<{ affected: number }>("/platform/batch-table-records", {
		body: input,
		method: "DELETE",
	});
}

export function exportBatchTableRecords(input: BatchTableSelectionInput) {
	return request<BatchTableExportResult>("/platform/batch-table-records/export", {
		body: input,
		method: "POST",
	});
}
