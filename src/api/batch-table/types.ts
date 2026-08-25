export type BatchTableRecordStatus = "active" | "disabled";

export interface BatchTableRecord {
	category: string;
	createdAt: string;
	id: string;
	name: string;
	owner: string;
	status: BatchTableRecordStatus;
	updatedAt: string;
}

export type BatchTableRecordSort = "name" | "owner" | "status" | "updated_at";

export interface ListBatchTableRecordsInput {
	category?: string;
	order?: "asc" | "desc";
	page: number;
	pageSize: number;
	q?: string;
	sort?: BatchTableRecordSort;
	status?: BatchTableRecordStatus;
}

export interface BatchTableRecordData {
	items: BatchTableRecord[];
	page: number;
	pageSize: number;
	total: number;
}

export interface BatchTableSelectionInput {
	ids: string[];
}

export interface UpdateBatchTableRecordStatusInput
	extends BatchTableSelectionInput {
	status: BatchTableRecordStatus;
}

export interface BatchTableExportResult {
	fileName: string;
	requestedAt: string;
	rowCount: number;
}
