import type { ProColumns } from "@ant-design/pro-components";
import zhCN from "antd/locale/zh_CN";
import { ConfigProvider } from "antd";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { getTableColumnSettingsStorageKey } from "./preferenceStorage";
import type { TableColumnConfig } from "./tableColumnVisibility";
import { i18n } from "../i18n";
import { ManagementProTable } from "./ManagementProTable";

interface TestRow {
	id: string;
	ip: string;
	result: string;
	username: string;
}

const columns: ProColumns<TestRow>[] = [
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
const columnVisibility: readonly TableColumnConfig<string>[] = [
	{ key: "username", visibility: "required" },
	{ key: "result", visibility: "recommended" },
	{ key: "ip", visibility: "optional" },
	{ key: "actions", visibility: "required" },
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

function renderManagementProTable() {
	render(
		<ConfigProvider locale={zhCN}>
			<ManagementProTable<TestRow, Record<string, never>>
				columnSettingsStorageKey={getTableColumnSettingsStorageKey("test-logs")}
				columnVisibility={columnVisibility}
				columns={columns}
				dataSource={rows}
				emptyText="暂无数据"
				initialLoading={false}
				onPageChange={vi.fn()}
				onReload={vi.fn()}
				onTableChange={vi.fn()}
				page={1}
				pageSize={10}
				search={false}
				refreshing={false}
				testId="test-log-table-card"
				title="测试日志"
				total={1}
			/>
		</ConfigProvider>,
	);

	return userEvent.setup();
}

describe("ManagementProTable", () => {
	it("migrates previous column choices once without replacing newer ProTable choices", () => {
		const key = getTableColumnSettingsStorageKey("test-logs");
		localStorage.setItem(
			key,
			JSON.stringify({
				columnOrder: ["username", "ip", "result", "actions"],
				visibleColumnKeys: ["username", "ip", "actions"],
			}),
		);
		renderManagementProTable();
		expect(
			screen.getAllByRole("columnheader").map((header) => header.textContent),
		).toEqual(["账号", "IP 地址", "操作"]);
		expect(localStorage.getItem(key)).toBeNull();
		cleanup();
		localStorage.setItem(
			key,
			JSON.stringify({ columnOrder: [], visibleColumnKeys: [] }),
		);
		renderManagementProTable();
		expect(screen.getByRole("columnheader", { name: "IP 地址" })).toBeVisible();
	});
	it("defaults to recommended columns and persists optional choices", async () => {
		const user = renderManagementProTable();

		expect(screen.getByRole("columnheader", { name: "账号" })).toBeVisible();
		expect(screen.getByRole("columnheader", { name: "结果" })).toBeVisible();
		expect(screen.getByRole("columnheader", { name: "操作" })).toBeVisible();
		expect(
			screen.queryByRole("columnheader", { name: /^(holder )?IP 地址$/ }),
		).not.toBeInTheDocument();

		await user.click(screen.getByRole("img", { name: "setting" }));
		expect(
			screen.queryByRole("checkbox", { name: /^(holder )?账号$/ }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole("checkbox", { name: /^(holder )?操作$/ }),
		).not.toBeInTheDocument();
		expect(
			screen.getByRole("checkbox", { name: /^(holder )?IP 地址$/ }),
		).not.toBeChecked();
		await user.click(
			screen.getByRole("checkbox", { name: /^(holder )?IP 地址$/ }),
		);
		expect(
			screen.getByRole("columnheader", { name: /^(holder )?IP 地址$/ }),
		).toBeVisible();
		expect(
			screen
				.getAllByRole("columnheader")
				.map((columnHeader) => columnHeader.textContent),
		).toEqual(["账号", "结果", "IP 地址", "操作"]);

		cleanup();
		const restoredUser = renderManagementProTable();

		expect(
			screen.getByRole("columnheader", { name: /^(holder )?IP 地址$/ }),
		).toBeVisible();
		await restoredUser.click(screen.getByRole("img", { name: "setting" }));
		await restoredUser.click(
			await screen.findByRole("checkbox", { name: "列展示" }),
		);
		expect(screen.getByRole("checkbox", { name: "列展示" })).not.toBeChecked();
		expect(
			screen.getAllByRole("columnheader").map((header) => header.textContent),
		).toEqual(["账号", "操作"]);
		await restoredUser.click(screen.getByText("重置", { exact: true }));
		expect(
			screen.getAllByRole("columnheader").map((header) => header.textContent),
		).toEqual(["账号", "结果", "操作"]);
		cleanup();
		renderManagementProTable();
		expect(
			screen.getAllByRole("columnheader").map((header) => header.textContent),
		).toEqual(["账号", "结果", "操作"]);
	});
});
