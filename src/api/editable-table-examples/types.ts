export type EditableTableRowStatus = "draft" | "active" | "paused";

export interface EditableTableRow {
	id: string;
	name: string;
	owner: string;
	priority: number;
	progress: number;
	status: EditableTableRowStatus;
	updatedAt: string;
}

export interface ListEditableTableRowsInput {
	order?: "asc" | "desc";
	page: number;
	pageSize: number;
	q?: string;
	sort?: "name" | "owner" | "priority" | "progress" | "status" | "updated_at";
	status?: EditableTableRowStatus;
}

export interface SaveEditableTableRowInput {
	name: string;
	owner: string;
	priority: number;
	progress: number;
	status: EditableTableRowStatus;
}
