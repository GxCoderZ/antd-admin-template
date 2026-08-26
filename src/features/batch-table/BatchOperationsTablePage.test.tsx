import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider } from "antd";
import { render, screen, waitFor, within } from "@testing-library/react";
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
		callCount: 120_000,
		createdAt: "2026-08-20T00:00:00.000Z",
		description: "这是一段描述",
		id: "record-1",
		lastScheduledAt: "1970-01-01T00:00:00.000Z",
		ruleName: "TradeCode 1",
		status: "online" as const,
	},
	{
		callCount: 340_000,
		createdAt: "2026-08-21T00:00:00.000Z",
		description: "这是一段描述",
		id: "record-2",
		lastScheduledAt: "1970-01-01T00:00:00.000Z",
		ruleName: "TradeCode 2",
		status: "closed" as const,
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

		expect(await screen.findByText("TradeCode 1")).toBeVisible();
		expect(screen.getByTestId("batch-table-query-form")).toBeVisible();
		expect(screen.getByText("已选择 0 项")).toBeVisible();
		expect(screen.getByRole("button", { name: "新建" })).toBeVisible();
		for (const actionName of ["刷新", "表格密度", "列设置", "表格全屏"]) {
			expect(screen.getByRole("button", { name: actionName })).toBeVisible();
		}
	});

	it("submits filters through the API contract", async () => {
		const user = renderPage();

		await screen.findByText("TradeCode 1");
		await user.type(
			within(screen.getByTestId("batch-table-query-form")).getByLabelText(
				"规则名称",
			),
			"TradeCode",
		);
		await user.click(screen.getByRole("button", { name: /查\s*询/ }));

		await waitFor(() => {
			expect(mocks.listRecords).toHaveBeenLastCalledWith(
				expect.objectContaining({ ruleName: "TradeCode" }),
				expect.any(AbortSignal),
			);
		});
	});

	it("shows selected count, clears selection and changes status without confirmation", async () => {
		const user = renderPage();

		await selectVisibleRows(user);
		await waitFor(() => expect(screen.getByText("已选择 2 项")).toBeVisible());
		expect(screen.getByText("服务调用次数总计 46 万")).toBeVisible();
		await user.click(screen.getByRole("button", { name: "批量停用" }));

		await waitFor(() => {
			expect(mocks.updateStatus.mock.calls[0]?.[0]).toEqual({
				ids: ["record-1", "record-2"],
				status: "closed",
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
