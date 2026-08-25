import { afterEach, describe, expect, it, vi } from "vitest";

import {
	confirmImportBatch,
	createExportTask,
	downloadExportTask,
	downloadImportTemplate,
	validateImportFile,
} from "./index";

afterEach(() => {
	vi.unstubAllGlobals();
});

function successResponse(data: unknown) {
	return new Response(JSON.stringify({ code: 0, data, msg: "OK" }), {
		headers: { "Content-Type": "application/json" },
		status: 200,
	});
}

describe("import-export API", () => {
	it("validates import files with FormData through the Fake API namespace", async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			successResponse({
				batchId: "import-1",
				createdAt: "2026-08-26T00:00:00.000Z",
				fileName: "users.csv",
				invalidRows: 0,
				issues: [],
				rows: [],
				status: "ready",
				totalRows: 0,
				validRows: 0,
			}),
		);
		vi.stubGlobal("fetch", fetchMock);

		await validateImportFile({
			file: new File(["name,email"], "users.csv", { type: "text/csv" }),
		});

		const [url, init] = fetchMock.mock.calls[0] as [
			string,
			RequestInit & { body: unknown },
		];
		expect(url).toBe("/api/platform/import-export/imports/validate");
		expect(
			init.body instanceof FormData &&
				init.body.get("file") instanceof File,
		).toBe(true);
		expect(init).toEqual(
			expect.objectContaining({
				method: "POST",
			}),
		);
	});

	it("maps template, confirm, export creation, and download requests", async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(
				successResponse({
					content: "name,email",
					fileName: "template.csv",
					mimeType: "text/csv",
				}),
			)
			.mockResolvedValueOnce(
				successResponse({
					batchId: "import-1",
					completedAt: "2026-08-26T00:00:00.000Z",
					failedRows: 0,
					importedRows: 3,
					skippedRows: 1,
				}),
			)
			.mockResolvedValueOnce(
				successResponse({
					createdAt: "2026-08-26T00:00:00.000Z",
					id: "export-1",
					name: "用户资料导出",
					progress: 12,
					status: "queued",
				}),
			)
			.mockResolvedValueOnce(
				successResponse({
					content: "id,name",
					fileName: "export.csv",
					mimeType: "text/csv",
				}),
			);
		vi.stubGlobal("fetch", fetchMock);

		await downloadImportTemplate("template-users");
		await confirmImportBatch({ batchId: "import-1" });
		await createExportTask({ name: "用户资料导出" });
		await downloadExportTask("export-1");

		expect(fetchMock).toHaveBeenNthCalledWith(
			1,
			"/api/platform/import-export/templates/template-users/download",
			expect.objectContaining({ method: "GET" }),
		);
		expect(fetchMock).toHaveBeenNthCalledWith(
			2,
			"/api/platform/import-export/imports/import-1/confirm",
			expect.objectContaining({ method: "POST" }),
		);
		expect(fetchMock).toHaveBeenNthCalledWith(
			3,
			"/api/platform/import-export/exports",
			expect.objectContaining({
				body: JSON.stringify({ name: "用户资料导出" }),
				method: "POST",
			}),
		);
		expect(fetchMock).toHaveBeenNthCalledWith(
			4,
			"/api/platform/import-export/exports/export-1/download",
			expect.objectContaining({ method: "GET" }),
		);
	});
});
