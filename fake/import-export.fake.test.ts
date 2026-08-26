import { describe, expect, it } from "vitest";

import importExportRoutes from "./import-export.fake";
import { exportTasks, importPreviews } from "./store";
import { findFakeRoute } from "./route-helpers";

function findRoute(method: string, url: string) {
	return findFakeRoute(importExportRoutes, method, url);
}

describe("Fake import-export", () => {
	it("returns templates and validates files with failure details", () => {
		const listTemplates = findRoute("get", "/platform/import-export/templates");
		const validate = findRoute(
			"post",
			"/platform/import-export/imports/validate",
		);
		const templates = listTemplates({}) as { data: unknown[] };
		const preview = validate({
			body: { name: "users.csv", size: 1024, type: "text/csv" },
		}) as { data: { batchId: string; invalidRows: number; issues: unknown[] } };

		expect(templates.data.length).toBeGreaterThan(0);
		expect(preview.data.invalidRows).toBeGreaterThan(0);
		expect(preview.data.issues.length).toBeGreaterThan(0);
		expect(
			importPreviews.some((item) => item.batchId === preview.data.batchId),
		).toBe(true);
	});

	it("persists import confirmation and advances export task progress", () => {
		const validate = findRoute(
			"post",
			"/platform/import-export/imports/validate",
		);
		const confirm = findRoute(
			"post",
			"/platform/import-export/imports/:batchId/confirm",
		);
		const createExport = findRoute("post", "/platform/import-export/exports");
		const getExport = findRoute(
			"get",
			"/platform/import-export/exports/:taskId",
		);
		const downloadExport = findRoute(
			"get",
			"/platform/import-export/exports/:taskId/download",
		);
		const preview = validate({
			body: { name: "clean-users.csv", size: 1024, type: "text/csv" },
		}) as { data: { batchId: string } };
		const result = confirm({
			params: { batchId: preview.data.batchId },
		}) as { data: { importedRows: number; skippedRows: number } };
		const task = createExport({
			body: { name: "Fake Export Flow" },
		}) as { data: { id: string } };

		expect(exportTasks.find((item) => item.id === task.data.id)?.status).toBe(
			"queued",
		);
		expect(getExport({ params: { taskId: task.data.id } })).toMatchObject({
			data: { progress: 44, status: "running" },
		});
		expect(getExport({ params: { taskId: task.data.id } })).toMatchObject({
			data: { progress: 76, status: "running" },
		});
		expect(getExport({ params: { taskId: task.data.id } })).toMatchObject({
			data: { progress: 100, status: "succeeded" },
		});
		const exported = exportTasks.find((item) => item.id === task.data.id);
		const download = downloadExport({
			params: { taskId: task.data.id },
		}) as { data: { content: string; fileName: string } };

		expect(result.data.importedRows).toBeGreaterThan(0);
		expect(result.data.skippedRows).toBe(0);
		expect(exported?.status).toBe("succeeded");
		expect(download.data.fileName).toMatch(/fake-export-flow/i);
		expect(download.data.content).toContain("Platform Admin");
	});
});
