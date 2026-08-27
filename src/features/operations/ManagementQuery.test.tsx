import type { ProFormInstance } from "@ant-design/pro-components";
import { useRef } from "react";
import {
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import { ConfigProvider, Input, Select } from "antd";
import zhCN from "antd/locale/zh_CN";
import { useState } from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { i18n, i18nReady } from "../../i18n";
import { LogTablePanel } from "./LogTablePanel";

interface QueryValues {
	q: string;
	status: string;
}

function QueryPanel({
	loading = false,
	onFinish,
	onReset,
}: {
	loading?: boolean;
	onFinish: (values: QueryValues) => void;
	onReset: () => void;
}) {
	const form = useRef<ProFormInstance<QueryValues>>(undefined);
	const [expanded, setExpanded] = useState(false);
	return (
		<ConfigProvider locale={zhCN}>
			<LogTablePanel<{ id: string }, QueryValues>
				columnSettingsStorageKey="test-query-columns"
				columnVisibility={[]}
				columns={[]}
				dataSource={[]}
				emptyText="No data"
				error={undefined}
				initialLoading={false}
				onReload={() => {}}
				page={1}
				pageSize={10}
				refreshing={loading}
				testId="test-table"
				title="Query"
				total={0}
				workspaceTestId="test-workspace"
				query={{
					expanded,
					formRef: form,
					initialValues: { q: "initial", status: "all" },
					loading,
					onExpandedChange: setExpanded,
					onFinish,
					onReset,
					testId: "query-form",
					columns: [
						{
							dataIndex: "q",
							title: "Keyword",
							formItemRender: () => <Input />,
						},
						{
							dataIndex: "status",
							title: "Status",
							formItemRender: () => (
								<Select options={[{ label: "All", value: "all" }]} />
							),
						},
					],
				}}
			/>
		</ConfigProvider>
	);
}

beforeAll(async () => {
	await i18nReady;
	await i18n.changeLanguage("zh-CN");
});

describe("ManagementQuery", () => {
	it("uses the Pro reset and query actions without changing submitted values", async () => {
		const onFinish = vi.fn();
		const onReset = vi.fn();
		render(<QueryPanel onFinish={onFinish} onReset={onReset} />);

		const actions = within(screen.getByTestId("query-form")).getAllByRole(
			"button",
		);
		expect(
			actions.map((button) => button.textContent?.replace(/\s/g, "")),
		).toEqual(["重置", "查询"]);
		fireEvent.change(screen.getByLabelText("Keyword"), {
			target: { value: "updated" },
		});
		fireEvent.click(screen.getByRole("button", { name: /查\s*询/ }));
		await waitFor(() =>
			expect(onFinish).toHaveBeenCalledWith({ q: "updated", status: "all" }),
		);
		fireEvent.click(screen.getByRole("button", { name: /重\s*置/ }));
		expect(onReset).toHaveBeenCalledOnce();
		expect(screen.getByLabelText("Keyword")).toHaveValue("initial");
	});

	it("keeps repeated reset available while a query is loading", () => {
		const onFinish = vi.fn();
		const onReset = vi.fn();
		render(<QueryPanel loading onFinish={onFinish} onReset={onReset} />);

		const reset = screen.getByRole("button", { name: /重\s*置/ });
		expect(reset).toBeEnabled();
		fireEvent.click(reset);
		fireEvent.click(reset);
		expect(onReset).toHaveBeenCalledTimes(2);
		expect(onFinish).not.toHaveBeenCalled();
	});
});
