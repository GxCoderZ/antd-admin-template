export type BatchTableRecordStatus =
	| "closed"
	| "exception"
	| "online"
	| "running";

export type BatchTableStatusMutation = "closed" | "online";

export interface BatchTableRecord {
	callCount: number;
	createdAt: string;
	description: string;
	id: string;
	lastScheduledAt: string;
	ruleName: string;
	status: BatchTableRecordStatus;
}

export type BatchTableRecordSort =
	| "call_count"
	| "last_scheduled_at"
	| "rule_name"
	| "status";

export interface ListBatchTableRecordsInput {
	callCount?: string;
	description?: string;
	order?: "asc" | "desc";
	page: number;
	pageSize: number;
	ruleName?: string;
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
	status: BatchTableStatusMutation;
}

export interface BatchTableExportResult {
	fileName: string;
	requestedAt: string;
	rowCount: number;
}
