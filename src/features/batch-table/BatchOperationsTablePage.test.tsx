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
	listRecords: vi.fn(),
	updateStatus: vi.fn(),
}));

vi.mock("#src/api/batch-table", () => ({
	batchTableRecordsQueryKey: ["batch-table-records"],
	deleteBatchTableRecords: mocks.deleteRecords,
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
	sessionStorage.clear();
	mocks.listRecords.mockReset().mockResolvedValue({
		items: records,
		page: 1,
		pageSize: 10,
		total: 2,
	});
	mocks.updateStatus.mockReset().mockResolvedValue({ affected: 2 });
	mocks.deleteRecords.mockReset().mockResolvedValue({ affected: 2 });
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
	it("uses the Ant Design Pro query panel and table toolbar", async () => {
		renderPage();

		expect(await screen.findByText("TradeCode 1")).toBeVisible();
		expect(screen.getByLabelText("规则名称")).toBeVisible();
		expect(screen.getByRole("button", { name: "新建" })).toBeVisible();
		expect(mocks.listRecords.mock.calls[0]?.[0]).not.toHaveProperty("order");
		expect(mocks.listRecords.mock.calls[0]?.[0]).not.toHaveProperty("sort");
		const sortableHeaders = screen
			.getAllByRole("columnheader")
			.filter((header) =>
				header.classList.contains("ant-table-column-has-sorters"),
			);
		expect(sortableHeaders).toHaveLength(1);
		expect(sortableHeaders[0]).toHaveTextContent("服务调用次数");
	});

	it("sorts by service call count only", async () => {
		const user = renderPage();

		await screen.findByText("TradeCode 1");
		const callCountHeader = screen
			.getAllByRole("columnheader")
			.find((header) => header.textContent?.includes("服务调用次数"));
		if (!callCountHeader) {
			throw new Error("Service call count header is missing");
		}
		await user.click(callCountHeader);

		await waitFor(() => {
			expect(mocks.listRecords.mock.calls.at(-1)?.[0]).toEqual(
				expect.objectContaining({ order: "asc", sort: "call_count" }),
			);
		});
	});

	it("submits filters through the API contract", async () => {
		const user = renderPage();

		await screen.findByText("TradeCode 1");
		await user.type(screen.getByLabelText("规则名称"), "TradeCode");
		await user.click(screen.getByRole("button", { name: /查\s*询/ }));

		await waitFor(() => {
			expect(mocks.listRecords.mock.calls.at(-1)?.[0]).not.toHaveProperty(
				"order",
			);
			expect(mocks.listRecords.mock.calls.at(-1)?.[0]).not.toHaveProperty(
				"sort",
			);
			expect(mocks.listRecords.mock.calls.at(-1)?.[0]).toEqual(
				expect.objectContaining({ ruleName: "TradeCode" }),
			);
		});
		const filteredRequestCount = mocks.listRecords.mock.calls.length;
		await user.click(screen.getByRole("button", { name: /查\s*询/ }));
		await waitFor(() =>
			expect(mocks.listRecords).toHaveBeenCalledTimes(filteredRequestCount + 1),
		);
		expect(mocks.listRecords.mock.calls.at(-1)?.[0]).toEqual(
			expect.objectContaining({ ruleName: "TradeCode" }),
		);
	});

	it("shows selected count, clears selection and approves without confirmation", async () => {
		const user = renderPage();

		await selectVisibleRows(user);
		await waitFor(() =>
			expect(screen.getByText(/已选择\s*2\s*项/)).toBeVisible(),
		);
		expect(screen.getByText("取消选择")).toBeVisible();
		expect(screen.getByText("服务调用次数总计 46 万")).toBeVisible();
		await user.click(screen.getByRole("button", { name: "批量审批" }));

		await waitFor(() => {
			expect(mocks.updateStatus.mock.calls[0]?.[0]).toEqual({
				ids: ["record-1", "record-2"],
				status: "online",
			});
		});
		expect(screen.queryByText("确认批量删除")).not.toBeInTheDocument();
		await waitFor(() =>
			expect(
				screen.queryByRole("button", { name: "批量审批" }),
			).not.toBeInTheDocument(),
		);

		await selectVisibleRows(user);
		await user.click(screen.getByText("取消选择"));
		expect(
			screen.queryByRole("button", { name: "批量审批" }),
		).not.toBeInTheDocument();
	});

	it("confirms dangerous bulk deletion", async () => {
		const user = renderPage();

		await selectVisibleRows(user);
		await waitFor(() =>
			expect(screen.getByText(/已选择\s*2\s*项/)).toBeVisible(),
		);
		expect(screen.getByText("取消选择")).toBeVisible();
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
