import { request } from "../client";
import type {
	ConfirmImportInput,
	CreateExportTaskInput,
	ExportDownload,
	ExportTask,
	ImportConfirmResult,
	ImportPreview,
	ImportTemplate,
	ImportTemplateDownload,
	ValidateImportInput,
} from "./types";

export * from "./types";

export const importTemplatesQueryKey = [
	"import-export",
	"templates",
] as const;
export const exportTasksQueryKey = ["import-export", "exports"] as const;

export function listImportTemplates(signal?: AbortSignal) {
	return request<ImportTemplate[]>("/platform/import-export/templates", {
		signal,
	});
}

export function downloadImportTemplate(templateId: string) {
	return request<ImportTemplateDownload>(
		`/platform/import-export/templates/${templateId}/download`,
	);
}

export function validateImportFile({ file }: ValidateImportInput) {
	const formData = new FormData();
	formData.append("file", file);
	return request<ImportPreview>("/platform/import-export/imports/validate", {
		body: formData,
		method: "POST",
	});
}

export function confirmImportBatch({ batchId }: ConfirmImportInput) {
	return request<ImportConfirmResult>(
		`/platform/import-export/imports/${batchId}/confirm`,
		{ method: "POST" },
	);
}

export function listExportTasks(signal?: AbortSignal) {
	return request<ExportTask[]>("/platform/import-export/exports", { signal });
}

export function createExportTask(input: CreateExportTaskInput) {
	return request<ExportTask>("/platform/import-export/exports", {
		body: input,
		method: "POST",
	});
}

export function downloadExportTask(taskId: string) {
	return request<ExportDownload>(
		`/platform/import-export/exports/${taskId}/download`,
	);
}
