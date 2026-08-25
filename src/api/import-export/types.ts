type ImportBatchStatus = "ready" | "failed" | "imported";

type ImportIssueSeverity = "error" | "warning";

export interface ImportTemplate {
	description: string;
	fileName: string;
	id: string;
	name: string;
	updatedAt: string;
}

export interface ImportTemplateDownload {
	content: string;
	fileName: string;
	mimeType: string;
}

export interface ImportPreviewRow {
	department: string;
	email: string;
	id: string;
	issueCount: number;
	name: string;
	rowNumber: number;
	status: "valid" | "invalid";
}

export interface ImportValidationIssue {
	field: string;
	id: string;
	message: string;
	rowNumber: number;
	severity: ImportIssueSeverity;
}

export interface ImportPreview {
	batchId: string;
	createdAt: string;
	fileName: string;
	invalidRows: number;
	issues: ImportValidationIssue[];
	rows: ImportPreviewRow[];
	status: ImportBatchStatus;
	totalRows: number;
	validRows: number;
}

export interface ValidateImportInput {
	file: File;
}

export interface ConfirmImportInput {
	batchId: string;
}

export interface ImportConfirmResult {
	batchId: string;
	completedAt: string;
	failedRows: number;
	importedRows: number;
	skippedRows: number;
}

type ExportTaskStatus = "queued" | "running" | "succeeded" | "failed";

export interface ExportTask {
	createdAt: string;
	errorMessage?: string;
	fileName?: string;
	finishedAt?: string;
	id: string;
	name: string;
	progress: number;
	status: ExportTaskStatus;
}

export interface CreateExportTaskInput {
	name: string;
}

export interface ExportDownload {
	content: string;
	fileName: string;
	mimeType: string;
}
