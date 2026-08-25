import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider } from "antd";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { LocalePreferencesProvider } from "../../app/LocalePreferencesProvider";
import { i18n } from "../../i18n";
import { BatchOperationsTablePage } from "./BatchOperationsTablePage";

const mocks = vi.hoisted(() => ({
	deleteRecords: vi.fn(),
	exportRecords: vi.fn(),
	listRecords: vi.fn(),
	updateStatus: vi.fn(),
}));

vi.mock("#src/api/batch-table", () => ({
	batchTableRecordsQueryKey: ["batch-table-records"],
	deleteBatchTableRecords: mocks.deleteRecords,
	exportBatchTableRecords: mocks.exportRecords,
	listBatchTableRecords: mocks.listRecords,
	updateBatchTableRecordStatus: mocks.updateStatus,
}));

const records = [
	{
		category: "权限资产",
		createdAt: "2026-08-20T00:00:00.000Z",
		id: "record-1",
		name: "批量演示记录 1",
		owner: "Platform Admin",
		status: "active" as const,
		updatedAt: "2026-08-20T01:00:00.000Z",
	},
	{
		category: "内容资产",
		createdAt: "2026-08-21T00:00:00.000Z",
		id: "record-2",
		name: "批量演示记录 2",
		owner: "Olivia Chen",
		status: "disabled" as const,
		updatedAt: "2026-08-21T01:00:00.000Z",
	},
];

beforeAll(async () => {
	await i18n.changeLanguage("zh-CN");
});

beforeEach(() => {
	mocks.listRecords.mockReset().mockResolvedValue({
		items: records,
		page: 1,
		pageSize: 10,
		total: 2,
	});
	mocks.updateStatus.mockReset().mockResolvedValue({ affected: 2 });
	mocks.deleteRecords.mockReset().mockResolvedValue({ affected: 2 });
	mocks.exportRecords.mockReset().mockResolvedValue({
		fileName: "batch-table-export.csv",
		requestedAt: "2026-08-26T00:00:00.000Z",
		rowCount: 2,
	});
});

function renderPage() {
	const queryClient = new QueryClient({
		defaultOptions: {
			mutations: { retry: false },
			queries: { retry: false },
		},
	});

	render(
		<ConfigProvider>
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
					<BatchOperationsTablePage />
				</QueryClientProvider>
			</LocalePreferencesProvider>
		</ConfigProvider>,
	);

	return userEvent.setup();
}

async function selectVisibleRows(user: ReturnType<typeof userEvent.setup>) {
	const selectAll = await screen.findByRole("checkbox", { name: "Select all" });
	await user.click(selectAll.closest("label") ?? selectAll);
}

describe("BatchOperationsTablePage", () => {
	it("uses the standard query panel and table toolbar", async () => {
		renderPage();

		expect(await screen.findByText("批量演示记录 1")).toBeVisible();
		expect(screen.getByTestId("batch-table-query-form")).toBeVisible();
		expect(screen.getByText("已选择 0 项")).toBeVisible();
		for (const actionName of ["刷新", "表格密度", "列设置", "表格全屏"]) {
			expect(screen.getByRole("button", { name: actionName })).toBeVisible();
		}
	});

	it("submits filters through the API contract", async () => {
		const user = renderPage();

		await screen.findByText("批量演示记录 1");
		await user.type(screen.getByPlaceholderText("搜索记录名称或负责人"), "Olivia");
		await user.click(screen.getByRole("button", { name: /查\s*询/ }));

		await waitFor(() => {
			expect(mocks.listRecords).toHaveBeenLastCalledWith(
				expect.objectContaining({ q: "Olivia" }),
				expect.any(AbortSignal),
			);
		});
	});

	it("shows selected count, clears selection and changes status without confirmation", async () => {
		const user = renderPage();

		await selectVisibleRows(user);
		await waitFor(() => expect(screen.getByText("已选择 2 项")).toBeVisible());
		await user.click(screen.getByRole("button", { name: "批量停用" }));

		await waitFor(() => {
			expect(mocks.updateStatus.mock.calls[0]?.[0]).toEqual({
				ids: ["record-1", "record-2"],
				status: "disabled",
			});
		});
		expect(screen.queryByText("确认批量删除")).not.toBeInTheDocument();
		await waitFor(() => expect(screen.getByText("已选择 0 项")).toBeVisible());

		await selectVisibleRows(user);
		await user.click(screen.getByRole("button", { name: "清空选择" }));
		expect(screen.getByText("已选择 0 项")).toBeVisible();
	});

	it("exports selected rows and confirms dangerous bulk deletion", async () => {
		const user = renderPage();

		await selectVisibleRows(user);
		await waitFor(() => expect(screen.getByText("已选择 2 项")).toBeVisible());
		await user.click(screen.getByRole("button", { name: "批量导出" }));
		await waitFor(() => {
			expect(mocks.exportRecords.mock.calls[0]?.[0]).toEqual({
				ids: ["record-1", "record-2"],
			});
		});

		await user.click(screen.getByRole("button", { name: "批量删除" }));
		const dialog = await screen.findByRole("dialog");
		expect(dialog).toHaveTextContent("确认批量删除");
		await user.click(screen.getByRole("button", { name: "确认删除" }));

		await waitFor(() => {
			expect(mocks.deleteRecords.mock.calls[0]?.[0]).toEqual({
				ids: ["record-1", "record-2"],
			});
		});
	});
});
