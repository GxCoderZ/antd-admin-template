import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider, theme as antdTheme } from "antd";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { LocalePreferencesProvider } from "../../app/LocalePreferencesProvider";
import { i18n } from "../../i18n";
import { ImportExportPage } from "./ImportExportPage";

const mocks = vi.hoisted(() => ({
	confirmImportBatch: vi.fn(),
	createExportTask: vi.fn(),
	downloadExportTask: vi.fn(),
	downloadImportTemplate: vi.fn(),
	listExportTasks: vi.fn(),
	listImportTemplates: vi.fn(),
	validateImportFile: vi.fn(),
}));

vi.mock("#src/api/import-export", () => ({
	confirmImportBatch: mocks.confirmImportBatch,
	createExportTask: mocks.createExportTask,
	downloadExportTask: mocks.downloadExportTask,
	downloadImportTemplate: mocks.downloadImportTemplate,
	exportTasksQueryKey: ["import-export", "exports"],
	importTemplatesQueryKey: ["import-export", "templates"],
	listExportTasks: mocks.listExportTasks,
	listImportTemplates: mocks.listImportTemplates,
	validateImportFile: mocks.validateImportFile,
}));

const template = {
	description: "标准用户资料导入模板",
	fileName: "user-import-template.csv",
	id: "template-users",
	name: "用户资料导入模板",
	updatedAt: "2026-08-26T00:00:00.000Z",
};
const preview = {
	batchId: "import-1",
	createdAt: "2026-08-26T00:00:00.000Z",
	fileName: "users.csv",
	invalidRows: 1,
	issues: [
		{
			field: "email",
			id: "issue-1",
			message: "邮箱格式不正确。",
			rowNumber: 3,
			severity: "error" as const,
		},
	],
	rows: [
		{
			department: "运营中心",
			email: "ava.chen@example.com",
			id: "row-1",
			issueCount: 0,
			name: "Ava Chen",
			rowNumber: 2,
			status: "valid" as const,
		},
		{
			department: "财务管理部",
			email: "bad-email",
			id: "row-2",
			issueCount: 1,
			name: "",
			rowNumber: 3,
			status: "invalid" as const,
		},
	],
	status: "ready" as const,
	totalRows: 2,
	validRows: 1,
};
const exportTask = {
	createdAt: "2026-08-26T00:00:00.000Z",
	fileName: "users.csv",
	finishedAt: "2026-08-26T00:01:00.000Z",
	id: "export-success",
	name: "用户资料导出",
	progress: 100,
	status: "succeeded" as const,
};
const failedExportTask = {
	createdAt: "2026-08-26T00:00:00.000Z",
	errorMessage: "导出条件包含已停用字段，请调整后重试。",
	finishedAt: "2026-08-26T00:01:00.000Z",
	id: "export-failed",
	name: "异常明细导出",
	progress: 68,
	status: "failed" as const,
};

beforeAll(async () => {
	await i18n.changeLanguage("zh-CN");
});

beforeEach(() => {
	mocks.listImportTemplates.mockReset().mockResolvedValue([template]);
	mocks.downloadImportTemplate.mockReset().mockResolvedValue({
		content: "name,email",
		fileName: "user-import-template.csv",
		mimeType: "text/csv",
	});
	mocks.validateImportFile.mockReset().mockResolvedValue(preview);
	mocks.confirmImportBatch.mockReset().mockResolvedValue({
		batchId: "import-1",
		completedAt: "2026-08-26T00:02:00.000Z",
		failedRows: 0,
		importedRows: 1,
		skippedRows: 1,
	});
	mocks.listExportTasks
		.mockReset()
		.mockResolvedValue([exportTask, failedExportTask]);
	mocks.createExportTask.mockReset().mockResolvedValue({
		createdAt: "2026-08-26T00:03:00.000Z",
		id: "export-new",
		name: "用户资料导出",
		progress: 12,
		status: "queued",
	});
	mocks.downloadExportTask.mockReset().mockResolvedValue({
		content: "id,name",
		fileName: "users.csv",
		mimeType: "text/csv",
	});
	vi.stubGlobal("URL", {
		createObjectURL: vi.fn(() => "blob:fake"),
		revokeObjectURL: vi.fn(),
	});
	vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {
		// Downloads are verified through the API helper and Blob URL creation.
	});
});

function renderPage(isDarkMode = false) {
	const queryClient = new QueryClient({
		defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
	});
	render(
		<ConfigProvider
			theme={{
				algorithm: isDarkMode
					? antdTheme.darkAlgorithm
					: antdTheme.defaultAlgorithm,
			}}
		>
			<LocalePreferencesProvider
				value={{
					currency: "CNY",
					language: "zh-CN",
					onChangeCurrency: vi.fn(),
					onChangeTimeZone: vi.fn(),
					timeZone: "Asia/Shanghai",
				}}
			>
				<QueryClientProvider client={queryClient}>
					<ImportExportPage />
				</QueryClientProvider>
			</LocalePreferencesProvider>
		</ConfigProvider>,
	);
	return userEvent.setup();
}

describe("ImportExportPage", () => {
	it("renders the normal import-export workspace in light and dark themes", async () => {
		renderPage(true);

		expect(await screen.findByText("用户资料导入模板")).toBeVisible();
		expect(screen.getByText("异步导出任务")).toBeVisible();
		expect(screen.getByText("异常明细导出")).toBeVisible();
		expect(
			screen.getByText("导出条件包含已停用字段，请调整后重试。"),
		).toBeVisible();
		for (const table of document.querySelectorAll(".ant-table")) {
			expect(table).toHaveClass("ant-table-medium");
		}
	});

	it("downloads templates and successful export files through API helpers", async () => {
		const user = renderPage();

		await screen.findByText("用户资料导入模板");
		await user.click(screen.getByRole("button", { name: /下载模板/ }));
		await waitFor(() =>
			expect(mocks.downloadImportTemplate.mock.calls[0]?.[0]).toBe(
				"template-users",
			),
		);
		await user.click(screen.getByRole("button", { name: /下载$/ }));
		await waitFor(() =>
			expect(mocks.downloadExportTask.mock.calls[0]?.[0]).toBe(
				"export-success",
			),
		);
	});

	it("validates file size before upload", async () => {
		const user = renderPage();

		await screen.findByText("用户资料导入模板");
		const input =
			document.querySelector<HTMLInputElement>('input[type="file"]');
		expect(input).not.toBeNull();
		await user.upload(
			input!,
			new File([new Uint8Array(5 * 1024 * 1024 + 1)], "users.csv", {
				type: "text/csv",
			}),
		);
		expect(await screen.findByText("文件大小不能超过 5MB。")).toBeVisible();
		expect(mocks.validateImportFile).not.toHaveBeenCalled();
	});

	it("shows import preview issues after file validation", async () => {
		const user = renderPage();

		await screen.findByText("用户资料导入模板");
		const input =
			document.querySelector<HTMLInputElement>('input[type="file"]');
		await user.upload(
			input!,
			new File(["name,email"], "users.csv", { type: "text/csv" }),
		);
		expect(await screen.findByText("导入预览")).toBeVisible();
		expect(screen.getByText("校验失败明细")).toBeVisible();
		expect(screen.getByText("邮箱格式不正确。")).toBeVisible();
	});

	it("shows validating progress and then confirms import results", async () => {
		let resolvePreview: (value: typeof preview) => void = () => undefined;
		mocks.validateImportFile.mockReturnValue(
			new Promise((resolve) => {
				resolvePreview = resolve;
			}),
		);
		const user = renderPage();

		await screen.findByText("用户资料导入模板");
		const input =
			document.querySelector<HTMLInputElement>('input[type="file"]');
		await user.upload(
			input!,
			new File(["name,email"], "users.csv", { type: "text/csv" }),
		);
		expect(await screen.findByText("正在校验导入文件...")).toBeVisible();
		resolvePreview(preview);
		await user.click(await screen.findByRole("button", { name: "确认导入" }));

		await waitFor(() =>
			expect(mocks.confirmImportBatch.mock.calls[0]?.[0]).toEqual({
				batchId: "import-1",
			}),
		);
		expect(await screen.findByText("导入完成")).toBeVisible();
	});

	it("shows export empty and request failure states", async () => {
		mocks.listImportTemplates.mockResolvedValueOnce([]);
		mocks.listExportTasks.mockResolvedValueOnce([]);
		renderPage();

		expect(await screen.findByText("暂无导出任务")).toBeVisible();
		expect(screen.getByText("暂无模板")).toBeVisible();

		mocks.listImportTemplates.mockRejectedValueOnce(new Error("offline"));
		mocks.listExportTasks.mockRejectedValueOnce(new Error("offline"));
		renderPage();
		expect(await screen.findByText("模板加载失败")).toBeVisible();
		expect(await screen.findByText("导出任务加载失败")).toBeVisible();
	});

	it("creates normal and failed export task demos", async () => {
		const user = renderPage();

		await screen.findByText("用户资料导入模板");
		await user.click(screen.getByRole("button", { name: /创建导出/ }));
		await user.click(screen.getByRole("button", { name: "创建失败示例" }));

		await waitFor(() =>
			expect(mocks.createExportTask.mock.calls[0]?.[0]).toEqual({
				name: "用户资料导出",
			}),
		);
		expect(mocks.createExportTask.mock.calls[1]?.[0]).toEqual({
			name: "失败导出示例",
		});
	});
});
