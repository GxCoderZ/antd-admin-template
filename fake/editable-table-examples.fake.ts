import { defineFakeRoute } from "vite-plugin-fake-server/client";

import type {
	EditableTableRow,
	EditableTableRowStatus,
	SaveEditableTableRowInput,
} from "../src/api/editable-table-examples";
import { editableTableRows } from "./store";
import { pageValue, resultError, resultSuccess, routeParam } from "./utils";

function getEditableTableRow(rowId: string | undefined) {
	return editableTableRows.find((row) => row.id === rowId);
}

function isEditableTableRowStatus(
	value: unknown,
): value is EditableTableRowStatus {
	return value === "draft" || value === "active" || value === "paused";
}

function isValidInput(
	input: Partial<SaveEditableTableRowInput>,
): input is SaveEditableTableRowInput {
	const { priority, progress } = input;
	return (
		typeof input.name === "string" &&
		input.name.trim().length > 0 &&
		typeof input.owner === "string" &&
		input.owner.trim().length > 0 &&
		typeof priority === "number" &&
		Number.isInteger(priority) &&
		priority >= 1 &&
		priority <= 999 &&
		typeof progress === "number" &&
		Number.isInteger(progress) &&
		progress >= 0 &&
		progress <= 100 &&
		isEditableTableRowStatus(input.status)
	);
}

export default defineFakeRoute([
	{
		method: "get",
		url: "/platform/editable-table-rows",
		response: ({ query }) => {
			const page = pageValue(query.page, 1);
			const pageSize = pageValue(query.page_size, 10);
			const keyword = String(query.q ?? "")
				.trim()
				.toLowerCase();
			const status = routeParam(query.status);
			const sort = routeParam(query.sort) ?? "updated_at";
			const order = routeParam(query.order) ?? "desc";
			const sortValue = (row: EditableTableRow) => {
				switch (sort) {
					case "name":
						return row.name;
					case "owner":
						return row.owner;
					case "priority":
						return row.priority;
					case "progress":
						return row.progress;
					case "status":
						return row.status;
					default:
						return row.updatedAt;
				}
			};
			const filtered = editableTableRows.filter(
				(row) =>
					(!keyword ||
						row.name.toLowerCase().includes(keyword) ||
						row.owner.toLowerCase().includes(keyword)) &&
					(!status || row.status === status),
			);
			const sorted = [...filtered].sort((left, right) => {
				const leftValue = sortValue(left);
				const rightValue = sortValue(right);
				const comparison =
					typeof leftValue === "number" && typeof rightValue === "number"
						? leftValue - rightValue
						: String(leftValue).localeCompare(String(rightValue));
				return comparison * (order === "asc" ? 1 : -1);
			});
			const start = (page - 1) * pageSize;

			return resultSuccess({
				items: sorted.slice(start, start + pageSize),
				page,
				page_size: pageSize,
				total: sorted.length,
			});
		},
	},
	{
		method: "post",
		url: "/platform/editable-table-rows",
		response: ({ body }) => {
			const input = body as Partial<SaveEditableTableRowInput>;
			if (!isValidInput(input)) {
				return resultError("Invalid editable table row input", 422);
			}

			const timestamp = new Date().toISOString();
			const row: EditableTableRow = {
				id: `editable-row-${Date.now()}`,
				name: input.name.trim(),
				owner: input.owner.trim(),
				priority: input.priority,
				progress: input.progress,
				status: input.status,
				updatedAt: timestamp,
			};
			editableTableRows.unshift(row);
			return resultSuccess(row);
		},
	},
	{
		method: "patch",
		url: "/platform/editable-table-rows/:rowId",
		response: ({ body, params }) => {
			const row = getEditableTableRow(routeParam(params.rowId));
			if (!row) {
				return resultError("Editable table row not found", 404);
			}

			const input = body as Partial<SaveEditableTableRowInput>;
			if (!isValidInput(input)) {
				return resultError("Invalid editable table row input", 422);
			}

			row.name = input.name.trim();
			row.owner = input.owner.trim();
			row.priority = input.priority;
			row.progress = input.progress;
			row.status = input.status;
			row.updatedAt = new Date().toISOString();
			return resultSuccess(row);
		},
	},
	{
		method: "delete",
		url: "/platform/editable-table-rows/:rowId",
		response: ({ params }) => {
			const rowId = routeParam(params.rowId);
			const index = editableTableRows.findIndex((row) => row.id === rowId);
			if (index < 0) {
				return resultError("Editable table row not found", 404);
			}

			editableTableRows.splice(index, 1);
			return resultSuccess(null);
		},
	},
]);
