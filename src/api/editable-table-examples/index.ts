import { request, type ApiPage } from "../client";
import type {
	EditableTableRow,
	ListEditableTableRowsInput,
	SaveEditableTableRowInput,
} from "./types";

export * from "./types";

export const editableTableRowsQueryKey = ["editable-table-rows"] as const;

export function listEditableTableRows(
	input: ListEditableTableRowsInput,
	signal?: AbortSignal,
) {
	const { pageSize, ...query } = input;
	return request<ApiPage<EditableTableRow>>("/platform/editable-table-rows", {
		query: { ...query, page_size: pageSize },
		signal,
	}).then(({ items, page, page_size, total }) => ({
		items,
		page,
		pageSize: page_size,
		total,
	}));
}

export function createEditableTableRow(input: SaveEditableTableRowInput) {
	return request<EditableTableRow>("/platform/editable-table-rows", {
		body: input,
		method: "POST",
	});
}

export function updateEditableTableRow({
	input,
	rowId,
}: {
	input: SaveEditableTableRowInput;
	rowId: string;
}) {
	return request<EditableTableRow>(`/platform/editable-table-rows/${rowId}`, {
		body: input,
		method: "PATCH",
	});
}

export function deleteEditableTableRow(rowId: string) {
	return request<void>(`/platform/editable-table-rows/${rowId}`, {
		method: "DELETE",
	});
}
