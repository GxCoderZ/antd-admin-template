import { defineFakeRoute } from "vite-plugin-fake-server/client";

import type {
	ExportTask,
	ImportPreview,
	ImportPreviewRow,
	ImportValidationIssue,
} from "../src/api/import-export";
import { exportTasks, importPreviews, importTemplates } from "./store";
import { resultError, resultSuccess, routeParam } from "./utils";

interface UploadBody {
	name?: string;
	size?: number;
	type?: string;
}

interface ExportBody {
	name?: string;
}

const templateContent = [
	"name,email,department,status",
	"Olivia Chen,olivia.chen@example.com,Operations,active",
	"Noah Wang,noah.wang@example.com,Finance,active",
].join("\n");

function readUpload(body: FormData | UploadBody | undefined): UploadBody {
	if (body instanceof FormData) {
		const file = body.get("file");
		return file instanceof File
			? { name: file.name, size: file.size, type: file.type }
			: {};
	}
	return body ?? {};
}

function makePreview(fileName: string): ImportPreview {
	const clean = /clean|valid|success/i.test(fileName);
	const rows: ImportPreviewRow[] = [
		{
			department: "运营中心",
			email: "ava.chen@example.com",
			id: "preview-row-1",
			issueCount: 0,
			name: "Ava Chen",
			rowNumber: 2,
			status: "valid",
		},
		{
			department: "财务管理部",
			email: clean ? "ben.wang@example.com" : "ben.wang",
			id: "preview-row-2",
			issueCount: clean ? 0 : 1,
			name: clean ? "Ben Wang" : "",
			rowNumber: 3,
			status: clean ? "valid" : "invalid",
		},
		{
			department: "平台研发部",
			email: "chris.li@example.com",
			id: "preview-row-3",
			issueCount: 0,
			name: "Chris Li",
			rowNumber: 4,
			status: "valid",
		},
	];
	const issues: ImportValidationIssue[] = clean
		? []
		: [
				{
					field: "name",
					id: "preview-issue-name",
					message: "姓名不能为空。",
					rowNumber: 3,
					severity: "error",
				},
				{
					field: "email",
					id: "preview-issue-email",
					message: "邮箱格式不正确。",
					rowNumber: 3,
					severity: "error",
				},
			];

	return {
		batchId: `import-${Date.now()}`,
		createdAt: new Date().toISOString(),
		fileName,
		invalidRows: rows.filter((row) => row.status === "invalid").length,
		issues,
		rows,
		status: "ready",
		totalRows: rows.length,
		validRows: rows.filter((row) => row.status === "valid").length,
	};
}

function progressTask(task: ExportTask) {
	if (task.status !== "queued" && task.status !== "running") {
		return task;
	}

	task.status = "running";
	task.progress = Math.min(100, task.progress + 32);
	if (task.progress >= 100) {
		task.status = "succeeded";
		task.fileName = `${task.name.replaceAll(/\s+/g, "-").toLowerCase()}-${Date.now()}.csv`;
		task.finishedAt = new Date().toISOString();
	}
	return task;
}

export default defineFakeRoute([
	{
		method: "get",
		url: "/platform/import-export/templates",
		response: () => resultSuccess(importTemplates),
	},
	{
		method: "get",
		url: "/platform/import-export/templates/:templateId/download",
		response: ({ params }) => {
			const template = importTemplates.find(
				(item) => item.id === routeParam(params.templateId),
			);
			if (!template) return resultError("Template not found", 404);

			return resultSuccess({
				content: templateContent,
				fileName: template.fileName,
				mimeType: "text/csv;charset=utf-8",
			});
		},
	},
	{
		method: "post",
		url: "/platform/import-export/imports/validate",
		response: ({ body }) => {
			const upload = readUpload(body);
			if (!upload.name?.trim() || !upload.size) {
				return resultError("Invalid import file", 422);
			}

			const preview = makePreview(upload.name.trim());
			importPreviews.unshift(preview);
			return resultSuccess(preview);
		},
	},
	{
		method: "post",
		url: "/platform/import-export/imports/:batchId/confirm",
		response: ({ params }) => {
			const preview = importPreviews.find(
				(item) => item.batchId === routeParam(params.batchId),
			);
			if (!preview) return resultError("Import batch not found", 404);
			if (preview.status === "imported") {
				return resultError("Import batch already confirmed", 409);
			}

			preview.status = "imported";
			return resultSuccess({
				batchId: preview.batchId,
				completedAt: new Date().toISOString(),
				failedRows: 0,
				importedRows: preview.validRows,
				skippedRows: preview.invalidRows,
			});
		},
	},
	{
		method: "get",
		url: "/platform/import-export/exports",
		response: () => resultSuccess(exportTasks.map(progressTask)),
	},
	{
		method: "post",
		url: "/platform/import-export/exports",
		response: ({ body }) => {
			const input = (body ?? {}) as ExportBody;
			if (!input.name?.trim()) {
				return resultError("Export task name is required", 422);
			}
			const task: ExportTask = {
				createdAt: new Date().toISOString(),
				id: `export-${Date.now()}`,
				name: input.name.trim(),
				progress: /fail|失败/i.test(input.name) ? 68 : 12,
				status: /fail|失败/i.test(input.name) ? "failed" : "queued",
				...(/fail|失败/i.test(input.name)
					? {
							errorMessage: "导出任务模拟失败，可重新创建任务。",
							finishedAt: new Date().toISOString(),
						}
					: {}),
			};
			exportTasks.unshift(task);
			return resultSuccess(task);
		},
	},
	{
		method: "get",
		url: "/platform/import-export/exports/:taskId",
		response: ({ params }) => {
			const task = exportTasks.find(
				(item) => item.id === routeParam(params.taskId),
			);
			if (!task) return resultError("Export task not found", 404);
			return resultSuccess(progressTask(task));
		},
	},
	{
		method: "get",
		url: "/platform/import-export/exports/:taskId/download",
		response: ({ params }) => {
			const task = exportTasks.find(
				(item) => item.id === routeParam(params.taskId),
			);
			if (!task) return resultError("Export task not found", 404);
			if (task.status !== "succeeded" || !task.fileName) {
				return resultError("Export file is not ready", 409);
			}

			return resultSuccess({
				content: [
					"id,name,status",
					"user-admin,Platform Admin,active",
					"user-demo-1,Avery Chen,active",
				].join("\n"),
				fileName: task.fileName,
				mimeType: "text/csv;charset=utf-8",
			});
		},
	},
]);
