import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider } from "antd";
import {
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { LocalePreferencesProvider } from "../../app/LocalePreferencesProvider";
import { i18n } from "../../i18n";
import { EditableTablePage } from "./EditableTablePage";

const mocks = vi.hoisted(() => ({
	createEditableTableRow: vi.fn(),
	deleteEditableTableRow: vi.fn(),
	listEditableTableRows: vi.fn(),
	updateEditableTableRow: vi.fn(),
}));

vi.mock("#src/api/editable-table-examples", () => ({
	createEditableTableRow: mocks.createEditableTableRow,
	deleteEditableTableRow: mocks.deleteEditableTableRow,
	editableTableRowsQueryKey: ["editable-table-rows"],
	listEditableTableRows: mocks.listEditableTableRows,
	updateEditableTableRow: mocks.updateEditableTableRow,
}));

const rows = [
	{
		id: "editable-row-1",
		name: "月度预算复核 1",
		owner: "Olivia Chen",
		priority: 10,
		progress: 20,
		status: "active" as const,
		updatedAt: "2026-08-20T01:00:00.000Z",
	},
	{
		id: "editable-row-2",
		name: "客户标签整理 2",
		owner: "Noah Wang",
		priority: 20,
		progress: 40,
		status: "draft" as const,
		updatedAt: "2026-08-20T02:00:00.000Z",
	},
];

const editableTablePageTestTimeout = 40_000;

beforeAll(async () => {
	await i18n.changeLanguage("zh-CN");
});

beforeEach(() => {
	sessionStorage.clear();
	mocks.listEditableTableRows.mockReset().mockResolvedValue({
		items: rows,
		page: 1,
		pageSize: 20,
		total: 2,
	});
	mocks.createEditableTableRow.mockReset().mockResolvedValue(rows[0]);
	mocks.deleteEditableTableRow.mockReset().mockResolvedValue(undefined);
	mocks.updateEditableTableRow.mockReset().mockResolvedValue(rows[0]);
});

function renderEditableTablePage() {
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
					<EditableTablePage />
				</QueryClientProvider>
			</LocalePreferencesProvider>
		</ConfigProvider>,
	);

	return userEvent.setup();
}

async function fillEditingRow({
	name,
	owner,
	priority,
	progress,
}: {
	name: string;
	owner: string;
	priority: string;
	progress: string;
}) {
	const editingRow = screen.getByRole("row", { name: /保存/ });
	const textboxes = within(editingRow).getAllByRole("textbox");
	await userEvent.clear(textboxes[0]!);
	await userEvent.type(textboxes[0]!, name);
	await userEvent.clear(textboxes[1]!);
	await userEvent.type(textboxes[1]!, owner);

	const spinButtons = within(editingRow).getAllByRole("spinbutton");
	await userEvent.clear(spinButtons[0]!);
	await userEvent.type(spinButtons[0]!, priority);
	await userEvent.clear(spinButtons[1]!);
	await userEvent.type(spinButtons[1]!, progress);
}

describe("EditableTablePage", () => {
	it(
		"uses the standard query bar and table toolbar",
		async () => {
			renderEditableTablePage();

			await screen.findByText("月度预算复核 1");
			expect(screen.getByTestId("editable-table-query-form")).toBeVisible();
			for (const actionName of ["新增行", "刷新", "表格密度", "列设置"]) {
				expect(screen.getByRole("button", { name: actionName })).toBeVisible();
			}
		},
		editableTablePageTestTimeout,
	);

	it(
		"adds a row through editable cells after field validation",
		async () => {
			const user = renderEditableTablePage();

			await screen.findByText("月度预算复核 1");
			await user.click(screen.getByRole("button", { name: "新增行" }));
			await user.click(screen.getByRole("button", { name: "保存" }));

			expect(await screen.findByText("请输入事项名称。")).toBeInTheDocument();
			expect(mocks.createEditableTableRow).not.toHaveBeenCalled();

			await fillEditingRow({
				name: "端到端资产清点",
				owner: "Sophia Sun",
				priority: "88",
				progress: "35",
			});
			await user.click(screen.getByRole("button", { name: "保存" }));

			await waitFor(() => {
				expect(mocks.createEditableTableRow).toHaveBeenCalledWith({
					name: "端到端资产清点",
					owner: "Sophia Sun",
					priority: 88,
					progress: 35,
					status: "draft",
				});
			});
		},
		editableTablePageTestTimeout,
	);

	it(
		"allows only one editable row at a time",
		async () => {
			renderEditableTablePage();

			await screen.findByText("月度预算复核 1");
			fireEvent.click(screen.getAllByRole("button", { name: "编辑" })[0]!);

			expect(screen.getByRole("button", { name: "新增行" })).toBeDisabled();
			expect(screen.getAllByRole("button", { name: "编辑" })[0]).toBeDisabled();
			expect(screen.getAllByRole("button", { name: "删除" })[0]).toBeDisabled();
		},
		editableTablePageTestTimeout,
	);

	it(
		"updates existing rows and can cancel a draft row",
		async () => {
			const user = renderEditableTablePage();

			await screen.findByText("月度预算复核 1");
			await user.click(screen.getAllByRole("button", { name: "编辑" })[0]!);
			await fillEditingRow({
				name: "月度预算复核更新",
				owner: "Olivia Chen",
				priority: "12",
				progress: "45",
			});
			await user.click(screen.getByRole("button", { name: "保存" }));

			await waitFor(() => {
				expect(mocks.updateEditableTableRow).toHaveBeenCalledWith({
					input: {
						name: "月度预算复核更新",
						owner: "Olivia Chen",
						priority: 12,
						progress: 45,
						status: "active",
					},
					rowId: "editable-row-1",
				});
			});

			await user.click(screen.getByRole("button", { name: "新增行" }));
			await user.click(screen.getByRole("button", { name: "取消" }));
			expect(screen.getByRole("button", { name: "新增行" })).toBeEnabled();
		},
		editableTablePageTestTimeout,
	);

	it(
		"deletes rows after explicit confirmation",
		async () => {
			const user = renderEditableTablePage();

			await screen.findByText("月度预算复核 1");
			await user.click(screen.getAllByRole("button", { name: "删除" })[0]!);
			await user.click(screen.getByRole("button", { name: "确认删除" }));

			await waitFor(() => {
				expect(mocks.deleteEditableTableRow).toHaveBeenCalledWith(
					"editable-row-1",
				);
			});
		},
		editableTablePageTestTimeout,
	);

	it(
		"submits keyword filters and table sorting through the API",
		async () => {
			const user = renderEditableTablePage();

			await screen.findByText("月度预算复核 1");
			await user.type(
				screen.getByPlaceholderText("搜索事项名称或负责人"),
				"预算",
			);
			await user.click(screen.getByRole("button", { name: /查\s*询/ }));

			await waitFor(() => {
				expect(mocks.listEditableTableRows).toHaveBeenLastCalledWith(
					expect.objectContaining({ q: "预算" }),
					expect.any(AbortSignal),
				);
			});

			await user.click(screen.getAllByText("优先级")[0]!);

			await waitFor(() => {
				expect(mocks.listEditableTableRows).toHaveBeenLastCalledWith(
					expect.objectContaining({ order: "asc", sort: "priority" }),
					expect.any(AbortSignal),
				);
			});
		},
		editableTablePageTestTimeout,
	);
});
