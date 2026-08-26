import { ConfigProvider } from "antd";
import type { TableColumnsType, TableProps } from "antd";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { getTableColumnSettingsStorageKey } from "../../app/preferenceStorage";
import type { ResponsiveTableColumnConfig } from "../../app/tableColumnVisibility";
import { i18n } from "../../i18n";
import { LogTablePanel } from "./LogTablePanel";

interface TestRow {
	id: string;
	ip: string;
	result: string;
	username: string;
}

const columns: TableColumnsType<TestRow> = [
	{
		dataIndex: "username",
		key: "username",
		title: "账号",
		width: 160,
	},
	{
		dataIndex: "result",
		key: "result",
		title: "结果",
		width: 96,
	},
	{
		key: "actions",
		render: () => "查看",
		title: "操作",
		width: 128,
	},
	{
		dataIndex: "ip",
		key: "ip",
		title: "IP 地址",
		width: 160,
	},
];
const columnVisibility: readonly ResponsiveTableColumnConfig<string>[] = [
	{ key: "username", priority: "compact", required: true },
	{ key: "result", priority: "compact" },
	{ key: "ip", priority: "regular" },
	{ key: "actions", priority: "compact", required: true },
];
const rows: TestRow[] = [
	{ id: "row-1", ip: "192.168.1.1", result: "成功", username: "admin" },
];

beforeAll(async () => {
	await i18n.changeLanguage("zh-CN");
});

beforeEach(() => {
	localStorage.clear();
	Object.defineProperty(document.body, "clientWidth", {
		configurable: true,
		value: 760,
	});
});

function renderLogTablePanel() {
	render(
		<ConfigProvider>
			<LogTablePanel<TestRow>
				columnSettingsStorageKey={getTableColumnSettingsStorageKey("test-logs")}
				columnVisibility={columnVisibility}
				columns={columns}
				dataSource={rows}
				emptyText="暂无数据"
				error={undefined}
				initialLoading={false}
				onPageChange={vi.fn()}
				onReload={vi.fn()}
				onTableChange={vi.fn() as NonNullable<TableProps<TestRow>["onChange"]>}
				page={1}
				pageSize={10}
				queryPanel={<div />}
				refreshing={false}
				testId="test-log-table-card"
				title="测试日志"
				total={1}
				workspaceTestId="test-log-table-workspace"
			/>
		</ConfigProvider>,
	);

	return userEvent.setup();
}

describe("LogTablePanel", () => {
	it("keeps all columns visible and persists manual column choices", async () => {
		const user = renderLogTablePanel();

		expect(screen.getByRole("columnheader", { name: "账号" })).toBeVisible();
		expect(screen.getByRole("columnheader", { name: "结果" })).toBeVisible();
		expect(screen.getByRole("columnheader", { name: "操作" })).toBeVisible();
		expect(screen.getByRole("columnheader", { name: "IP 地址" })).toBeVisible();

		await user.click(screen.getByRole("button", { name: "列设置" }));
		expect(screen.getByRole("checkbox", { name: "账号" })).toBeDisabled();
		expect(screen.getByRole("checkbox", { name: "操作" })).toBeDisabled();
		await user.click(screen.getByRole("checkbox", { name: "IP 地址" }));
		expect(
			screen.queryByRole("columnheader", { name: "IP 地址" }),
		).not.toBeInTheDocument();
		expect(
			screen
				.getAllByRole("columnheader")
				.map((columnHeader) => columnHeader.textContent),
		).toEqual(["账号", "结果", "操作"]);

		cleanup();
		renderLogTablePanel();

		expect(
			screen.queryByRole("columnheader", { name: "IP 地址" }),
		).not.toBeInTheDocument();
	});
});
